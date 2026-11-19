import { Color } from 'three'

/**
 * Three.js can't parse oklch(), which the theme tokens use. Painting the token onto a
 * 1px canvas and reading the pixel back converts any CSS color into sRGB.
 */
export function cssVarColor(name: string, fallback = '#111111', el: Element = document.documentElement) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  if (!raw) return new Color(fallback)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return new Color(fallback)
  ctx.fillStyle = fallback
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return new Color().setRGB(r / 255, g / 255, b / 255, 'srgb')
}

/** Routes AniList artwork through /api/kapak so WebGL can use it as a texture. */
export function textureUrl(url: string) {
  return `/api/kapak?u=${encodeURIComponent(url)}`
}
