function assTime(t: string) {
  const [h, m, s] = t.trim().split(':')
  const [sec, cs = '0'] = s.split('.')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${sec.padStart(2, '0')}.${cs.padEnd(3, '0').slice(0, 3)}`
}

function assToVtt(input: string) {
  const lines = input.split(/\r?\n/)
  let format: string[] = []
  const cues: string[] = []
  let inEvents = false
  for (const line of lines) {
    if (/^\[events\]/i.test(line.trim())) {
      inEvents = true
      continue
    }
    if (/^\[.*\]$/.test(line.trim())) {
      inEvents = false
      continue
    }
    if (!inEvents) continue
    if (line.startsWith('Format:')) format = line.slice(7).split(',').map((f) => f.trim().toLowerCase())
    if (line.startsWith('Dialogue:')) {
      const parts = line.slice(9).split(',')
      const textIndex = format.indexOf('text')
      const start = parts[format.indexOf('start')]
      const end = parts[format.indexOf('end')]
      if (!start || !end || textIndex < 0) continue
      const text = parts
        .slice(textIndex)
        .join(',')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\\N/gi, '\n')
        .trim()
      if (text) cues.push(`${assTime(start)} --> ${assTime(end)}\n${text}`)
    }
  }
  return `WEBVTT\n\n${cues.join('\n\n')}\n`
}

export function toVtt(input: string) {
  const text = input.replace(/^\uFEFF/, '').trim()
  if (text.startsWith('WEBVTT')) return text + '\n'
  if (/^\[script info\]/i.test(text) || text.includes('Dialogue:')) return assToVtt(text)
  const body = text
    .replace(/\r/g, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    .replace(/(\d{1,2}:\d{2}),(\d{3})/g, '$1.$2')
  return `WEBVTT\n\n${body}\n`
}
