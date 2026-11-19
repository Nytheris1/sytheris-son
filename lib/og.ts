export async function loadGoogleFont(family: string, weight: number, style: 'normal' | 'italic' = 'normal') {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${style === 'italic' ? 'ital,' : ''}wght@${style === 'italic' ? '1,' : ''}${weight}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sytheris OG)' },
      })
    ).text()
    const url = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1]
    if (!url) return null
    return await (await fetch(url)).arrayBuffer()
  } catch {
    return null
  }
}
