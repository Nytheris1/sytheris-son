export type CustomTheme = { id: string; name: string; hex: string }

export const CUSTOM_THEME_KEY = 'sy-custom-theme'
export const CUSTOM_THEME_LIMIT = 8
export const HEX_RE = /^#[0-9a-f]{6}$/i

export const CUSTOM_VAR_NAMES = ['--hue', '--chroma', '--primary', '--primary-foreground', '--ink-light', '--ink-dark'] as const

function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** sRGB hex → OKLCH (L 0–1, C ~0–0.37, h degrees). */
export function hexToOklch(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = srgbToLinear(((n >> 16) & 255) / 255)
  const g = srgbToLinear(((n >> 8) & 255) / 255)
  const b = srgbToLinear((n & 255) / 255)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.sqrt(A * A + B * B)
  let h = (Math.atan2(B, A) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c: C, h }
}

const r3 = (n: number) => Math.round(n * 1000) / 1000

/** CSS variables that make a single brand colour drive the whole theme, with readable contrast. */
export function customThemeVars(hex: string): Record<(typeof CUSTOM_VAR_NAMES)[number], string> {
  const { l, c, h } = hexToOklch(hex)
  const hue = Math.round(h)
  const chroma = r3(Math.min(c, 0.24))
  const lightText = l < 0.68
  return {
    '--hue': String(hue),
    '--chroma': String(chroma),
    '--primary': hex,
    '--primary-foreground': lightText ? `oklch(0.985 0.01 ${hue})` : `oklch(0.2 ${r3(Math.min(c, 0.08))} ${hue})`,
    '--ink-light': `oklch(${r3(Math.min(l, 0.52))} ${r3(Math.min(c, 0.2))} ${hue})`,
    '--ink-dark': `oklch(${r3(Math.max(l, 0.8))} ${r3(Math.min(c, 0.17))} ${hue})`,
  }
}

export function sanitizeThemeName(name: string) {
  return name.replace(/[<>{}`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24)
}

function linearToSrgb(c: number) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function oklchToLinearRgb(l: number, c: number, h: number) {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m_ = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s_ = Math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3)
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

/** OKLCH → sRGB hex, pulling chroma in until the colour fits the sRGB gamut. */
export function oklchToHex(l: number, c: number, h: number) {
  let chroma = c
  let rgb = oklchToLinearRgb(l, chroma, h)
  for (let i = 0; i < 30 && rgb.some((v) => v < -0.0005 || v > 1.0005); i++) {
    chroma *= 0.94
    rgb = oklchToLinearRgb(l, chroma, h)
  }
  return (
    '#' +
    rgb
      .map((v) => Math.round(Math.min(1, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, v))))) * 255))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}
