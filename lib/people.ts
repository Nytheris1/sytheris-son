import 'server-only'
import { cache } from 'react'
import { translate } from './translate'

/*
 * Cast & person data for cinema mode. Wikidata (keyless) supplies film casts, biographies and filmographies;
 * its iTunes movie ID (P6398) and TVmaze series ID (P8600) claims link credits back to our own film / dizi pages.
 * TVmaze people cover series casts. Person ids are either a Wikidata QID ("Q189489") or a TVmaze id ("tv-56299").
 * Everything is cached for a day and fails soft.
 */

const DAY = 86400
const HEADERS = { 'User-Agent': 'SyraCinema/1.0 (cinema mode; contact via site)', Accept: 'application/json' }

export type CastMember = { id: string; name: string; character: string | null; image: string | null }

export type PersonCredit = {
  key: string
  kind: 'film' | 'dizi'
  title: string
  year: number | null
  character: string | null
  href: string | null
  poster: string | null
}

export type Person = {
  id: string
  name: string
  description: string | null
  birth: string | null
  death: string | null
  birthPlace: string | null
  country: string | null
  image: string | null
  bio: string | null
  bioTranslated: boolean
  wikiUrl: string | null
  credits: PersonCredit[]
}

const isQid = (v: string) => /^Q\d{1,10}$/.test(v)
const qidOf = (uri: string) => uri.split('/').pop() ?? ''
const realLabel = (v?: string | null) => (v && !/^Q\d+$/.test(v) ? v : null)
const cleanCharacter = (v?: string | null) => realLabel(v)?.replace(/\s*\([^)]*\)\s*$/, '').trim() || null

export function commons(url: string | null | undefined, width = 600) {
  if (!url) return null
  return `${url.replace(/^http:/, 'https:')}?width=${width}`
}

function itunesSized(url: string, w: number, h: number) {
  return url.replace(/\/\d+x\d+bb(-\d+)?\.(png|jpg|jpeg)$/i, `/${w}x${h}bb.jpg`)
}

async function getJson<T>(url: string, revalidate = DAY): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function sparql(query: string): Promise<Record<string, string>[]> {
  const json = await getJson<{ results?: { bindings?: Record<string, { value: string }>[] } }>(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`)
  return (json?.results?.bindings ?? []).map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])))
}

async function searchEntities(term: string, lang: 'tr' | 'en') {
  const json = await getJson<{ search?: { id: string; label?: string; description?: string }[] }>(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=${lang}&uselang=${lang}&type=item&limit=7&format=json`,
  )
  return json?.search ?? []
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const NOT_A_FILM = /album|soundtrack|novel|book|video game|single|song|roman|kitap|şarkı|oyun|episode|bölüm|franchise|series of|dizi/i

/** Finds the Wikidata film matching an iTunes title, preferring a director match, then the closest release year. */
async function resolveFilm(title: string, year: number | null, director: string) {
  const base = title.replace(/\s*\((\d{4}|.*edition|.*version)\)\s*$/i, '').trim()
  const [tr, en] = await Promise.all([searchEntities(base, 'tr'), searchEntities(base, 'en')])
  const ids = [...new Set([...en, ...tr].filter((x) => !NOT_A_FILM.test(x.description ?? '')).map((x) => x.id))].filter(isQid).slice(0, 10)
  if (!ids.length) return null

  const rows = await sparql(`SELECT ?f (MIN(YEAR(?d)) AS ?y) (GROUP_CONCAT(DISTINCT ?dl; separator="|") AS ?dirs) WHERE {
    VALUES ?f { ${ids.map((i) => `wd:${i}`).join(' ')} }
    ?f wdt:P161 [] .
    OPTIONAL { ?f wdt:P577 ?d }
    OPTIONAL { ?f wdt:P57 ?dir . ?dir rdfs:label ?dl . FILTER(LANG(?dl) = "en" || LANG(?dl) = "mul") }
  } GROUP BY ?f`)

  const wanted = norm(director)
  let best: { id: string; score: number } | null = null
  for (const r of rows) {
    const id = qidOf(r.f)
    const y = r.y ? Number(r.y) : null
    const dirMatch = Boolean(wanted) && (r.dirs ?? '').split('|').some((d) => d && (wanted.includes(norm(d)) || norm(d).includes(wanted)))
    const diff = year && y ? Math.abs(year - y) : 3
    if (!dirMatch && diff > 1) continue
    const score = (dirMatch ? 0 : 5) + Math.min(diff, 5) + ids.indexOf(id) * 0.01
    if (!best || score < best.score) best = { id, score }
  }
  return best?.id ?? null
}

type Claim = {
  rank?: string
  mainsnak?: { datavalue?: { value?: { id?: string } } }
  qualifiers?: Record<string, { datavalue?: { value?: { id?: string } | string } }[]>
}

/** Billing-order cast for a film, with portraits and character names. */
export const getFilmCast = cache(async (title: string, year: number | null, director: string): Promise<CastMember[]> => {
  const qid = await resolveFilm(title, year, director)
  if (!qid) return []

  const entity = await getJson<{ entities?: Record<string, { claims?: Record<string, Claim[]> }> }>(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json`,
  )
  const claims = (entity?.entities?.[qid]?.claims?.P161 ?? []).filter((c) => c.rank !== 'deprecated').slice(0, 18)
  const cast = claims
    .map((c) => {
      const actor = c.mainsnak?.datavalue?.value?.id
      const charItem = c.qualifiers?.P453?.[0]?.datavalue?.value
      const charName = c.qualifiers?.P4633?.[0]?.datavalue?.value
      return actor && isQid(actor)
        ? { actor, charId: typeof charItem === 'object' && charItem?.id && isQid(charItem.id) ? charItem.id : null, charName: typeof charName === 'string' ? charName : null }
        : null
    })
    .filter((c): c is { actor: string; charId: string | null; charName: string | null } => Boolean(c))
  if (!cast.length) return []

  const lookupIds = [...new Set(cast.flatMap((c) => [c.actor, c.charId].filter((x): x is string => Boolean(x))))]
  const rows = await sparql(`SELECT ?a ?aLabel ?img WHERE {
    VALUES ?a { ${lookupIds.map((i) => `wd:${i}`).join(' ')} }
    OPTIONAL { ?a wdt:P18 ?img }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en,mul". }
  }`)
  const info = new Map<string, { label: string | null; img: string | null }>()
  for (const r of rows) {
    const id = qidOf(r.a)
    if (!info.has(id)) info.set(id, { label: realLabel(r.aLabel), img: r.img ?? null })
  }

  const seen = new Set<string>()
  return cast
    .filter((c) => {
      if (seen.has(c.actor)) return false
      seen.add(c.actor)
      return Boolean(info.get(c.actor)?.label)
    })
    .map((c) => ({
      id: c.actor,
      name: info.get(c.actor)!.label!,
      character: cleanCharacter(c.charName ?? (c.charId ? info.get(c.charId)?.label : null)),
      image: commons(info.get(c.actor)?.img, 420),
    }))
})

const FILM_TYPES = new Set(['Q11424', 'Q24869', 'Q506240', 'Q93204', 'Q29168811', 'Q202866', 'Q24862', 'Q226730', 'Q17517379'])
const SERIES_TYPES = new Set(['Q5398426', 'Q1259759', 'Q581714', 'Q15416', 'Q526877', 'Q21191019'])

type TvmazeShow = { id: number; name: string; type: string; language: string | null; premiered: string | null; image?: { medium: string; original: string } | null }
type TvmazePerson = {
  id: number
  name: string
  birthday: string | null
  deathday: string | null
  country?: { name: string } | null
  image?: { medium: string; original: string } | null
}
type TvmazeCredit = { voice?: boolean; _embedded?: { show?: TvmazeShow; character?: { name: string } } }

const showHref = (s: TvmazeShow) => (s.type === 'Animation' || s.language === 'Japanese' || !s.image ? null : `/dizi/${s.id}`)

async function wikiIntro(url: string | null) {
  if (!url) return null
  const m = url.match(/^https:\/\/(tr|en)\.wikipedia\.org\/wiki\/(.+)$/)
  if (!m) return null
  const json = await getJson<{ query?: { pages?: Record<string, { extract?: string }> } }>(
    `https://${m[1]}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&titles=${m[2]}`,
  )
  const text = Object.values(json?.query?.pages ?? {})[0]?.extract?.trim()
  return text ? { lang: m[1] as 'tr' | 'en', text } : null
}

async function wikidataPerson(qid: string) {
  const [basics] = await sparql(`SELECT ?pLabel ?pDescription ?birth ?death ?placeLabel ?countryLabel ?img ?trw ?enw WHERE {
    VALUES ?p { wd:${qid} }
    OPTIONAL { ?p wdt:P569 ?birth }
    OPTIONAL { ?p wdt:P570 ?death }
    OPTIONAL { ?p wdt:P19 ?place }
    OPTIONAL { ?p wdt:P27 ?country }
    OPTIONAL { ?p wdt:P18 ?img }
    OPTIONAL { ?trw schema:about ?p ; schema:isPartOf <https://tr.wikipedia.org/> }
    OPTIONAL { ?enw schema:about ?p ; schema:isPartOf <https://en.wikipedia.org/> }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en,mul". }
  } LIMIT 1`)
  return basics ?? null
}

async function wikidataCredits(qid: string) {
  return sparql(`SELECT ?w (SAMPLE(?wl) AS ?title) (MIN(YEAR(?d)) AS ?y) (SAMPLE(?cl) AS ?char) (SAMPLE(?cs) AS ?charStr) (SAMPLE(?it) AS ?itunes) (SAMPLE(?tvm) AS ?tvmaze)
    (GROUP_CONCAT(DISTINCT STRAFTER(STR(?t), "entity/"); separator=",") AS ?types) WHERE {
    ?w p:P161 ?st . ?st ps:P161 wd:${qid} .
    ?w wdt:P31 ?t .
    OPTIONAL { ?w rdfs:label ?wTr FILTER(LANG(?wTr) = "tr") }
    OPTIONAL { ?w rdfs:label ?wEn FILTER(LANG(?wEn) = "en") }
    OPTIONAL { ?w rdfs:label ?wMul FILTER(LANG(?wMul) = "mul") }
    BIND(COALESCE(?wTr, ?wEn, ?wMul) AS ?wl)
    OPTIONAL {
      ?st pq:P453 ?c .
      OPTIONAL { ?c rdfs:label ?cTr FILTER(LANG(?cTr) = "tr") }
      OPTIONAL { ?c rdfs:label ?cEn FILTER(LANG(?cEn) = "en") }
    }
    BIND(COALESCE(?cTr, ?cEn) AS ?cl)
    OPTIONAL { ?st pq:P4633 ?cs }
    OPTIONAL { ?w wdt:P577 ?d }
    OPTIONAL { ?w wdt:P6398 ?it }
    OPTIONAL { ?w wdt:P8600 ?tvm }
  } GROUP BY ?w LIMIT 300`)
}

async function itunesPosters(ids: string[]) {
  const out = new Map<string, { poster: string; title: string }>()
  const clean = ids.filter((i) => /^\d{3,14}$/.test(i)).slice(0, 60)
  if (!clean.length) return out
  const json = await getJson<{ results?: { trackId: number; trackName: string; artworkUrl100?: string }[] }>(`https://itunes.apple.com/lookup?id=${clean.join(',')}&country=tr`, 21600)
  for (const r of json?.results ?? []) if (r.artworkUrl100) out.set(String(r.trackId), { poster: itunesSized(r.artworkUrl100, 400, 600), title: r.trackName })
  return out
}

async function resolvePersonQid(name: string, birthday: string | null) {
  const hits = (await searchEntities(name, 'en')).filter((h) => /actor|actress|comedian|performer|presenter|model|singer|filmmaker|director|writer/i.test(h.description ?? '')).slice(0, 2)
  for (const h of hits) {
    if (!isQid(h.id)) continue
    if (!birthday) return h.id
    const [row] = await sparql(`SELECT ?b WHERE { wd:${h.id} wdt:P569 ?b } LIMIT 1`)
    if (!row?.b || row.b.slice(0, 4) === birthday.slice(0, 4)) return h.id
  }
  return null
}

export const getPerson = cache(async (id: string): Promise<Person | null> => {
  let qid: string | null = null
  let tv: { person: TvmazePerson; credits: TvmazeCredit[] } | null = null

  if (isQid(id)) {
    qid = id
  } else {
    const m = id.match(/^tv-(\d{1,8})$/)
    if (!m) return null
    const [person, credits] = await Promise.all([
      getJson<TvmazePerson>(`https://api.tvmaze.com/people/${m[1]}`),
      getJson<TvmazeCredit[]>(`https://api.tvmaze.com/people/${m[1]}/castcredits?embed[]=show&embed[]=character`),
    ])
    if (!person) return null
    tv = { person, credits: credits ?? [] }
    qid = await resolvePersonQid(person.name, person.birthday)
  }

  const [basics, rows] = qid ? await Promise.all([wikidataPerson(qid), wikidataCredits(qid)]) : [null, [] as Record<string, string>[]]
  if (!basics && !tv) return null

  const credits: PersonCredit[] = []
  const filmRows = rows.filter((r) => r.itunes || r.types?.split(',').some((t) => FILM_TYPES.has(t)))
  const seriesRows = rows.filter((r) => !filmRows.includes(r) && (r.tvmaze || r.types?.split(',').some((t) => SERIES_TYPES.has(t))))

  const posters = await itunesPosters(filmRows.map((r) => r.itunes).filter(Boolean))
  for (const r of filmRows) {
    const title = realLabel(r.title)
    if (!title) continue
    const it = r.itunes ? posters.get(r.itunes) : undefined
    credits.push({
      key: qidOf(r.w),
      kind: 'film',
      title,
      year: r.y ? Number(r.y) : null,
      character: cleanCharacter(r.charStr || r.char),
      href: it ? `/film/${r.itunes}` : null,
      poster: it?.poster ?? null,
    })
  }

  const seenShows = new Set<string>()
  if (tv) {
    for (const c of tv.credits) {
      const s = c._embedded?.show
      if (!s || seenShows.has(String(s.id))) continue
      seenShows.add(String(s.id))
      credits.push({
        key: `tv-${s.id}`,
        kind: 'dizi',
        title: s.name,
        year: s.premiered ? new Date(s.premiered).getFullYear() : null,
        character: c._embedded?.character?.name ?? null,
        href: showHref(s),
        poster: s.image?.medium ?? null,
      })
    }
  }
  const missing = seriesRows.filter((r) => !r.tvmaze || !seenShows.has(r.tvmaze))
  const shows = await Promise.all(missing.slice(0, 14).map((r) => (r.tvmaze && /^\d+$/.test(r.tvmaze) ? getJson<TvmazeShow>(`https://api.tvmaze.com/shows/${r.tvmaze}`) : null)))
  missing.forEach((r, i) => {
    const title = realLabel(r.title)
    if (!title) return
    const s = shows[i] ?? null
    if (s) seenShows.add(String(s.id))
    credits.push({
      key: qidOf(r.w),
      kind: 'dizi',
      title: s?.name ?? title,
      year: r.y ? Number(r.y) : s?.premiered ? new Date(s.premiered).getFullYear() : null,
      character: cleanCharacter(r.charStr || r.char),
      href: s ? showHref(s) : null,
      poster: s?.image?.medium ?? null,
    })
  })

  credits.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || Number(Boolean(b.poster)) - Number(Boolean(a.poster)))

  const wikiUrl = basics?.trw ?? basics?.enw ?? null
  const intro = await wikiIntro(wikiUrl)
  let bio = intro?.text ?? null
  let bioTranslated = false
  if (intro?.lang === 'en') {
    const tr = await translate(intro.text, 'tr').catch(() => null)
    if (tr) {
      bio = tr
      bioTranslated = true
    }
  }

  return {
    id,
    name: realLabel(basics?.pLabel) ?? tv?.person.name ?? 'Bilinmeyen oyuncu',
    description: basics?.pDescription ?? null,
    birth: basics?.birth ?? tv?.person.birthday ?? null,
    death: basics?.death ?? tv?.person.deathday ?? null,
    birthPlace: realLabel(basics?.placeLabel),
    country: realLabel(basics?.countryLabel) ?? tv?.person.country?.name ?? null,
    image: commons(basics?.img, 900) ?? tv?.person.image?.original ?? null,
    bio,
    bioTranslated,
    wikiUrl,
    credits,
  }
})

export function ageOf(birth: string | null, death: string | null) {
  if (!birth) return null
  const b = new Date(birth)
  const end = death ? new Date(death) : new Date()
  let age = end.getFullYear() - b.getFullYear()
  if (end.getMonth() < b.getMonth() || (end.getMonth() === b.getMonth() && end.getDate() < b.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}
