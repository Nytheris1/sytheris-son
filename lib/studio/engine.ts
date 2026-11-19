/**
 * Çizim Atölyesi — pixel engine. Pure canvas helpers with no React,
 * so the editor component only orchestrates state.
 */

export type ToolId = 'brush' | 'pencil' | 'airbrush' | 'ink' | 'marker' | 'eraser' | 'fill' | 'picker' | 'line' | 'rect' | 'ellipse' | 'pan'

export type BlendMode = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'soft-light' | 'hard-light' | 'difference'

export const BLEND_MODES: { id: BlendMode; label: string }[] = [
  { id: 'source-over', label: 'Normal' },
  { id: 'multiply', label: 'Çarp' },
  { id: 'screen', label: 'Ekran' },
  { id: 'overlay', label: 'Kaplama' },
  { id: 'soft-light', label: 'Yumuşak ışık' },
  { id: 'hard-light', label: 'Sert ışık' },
  { id: 'darken', label: 'Koyulaştır' },
  { id: 'lighten', label: 'Açıklaştır' },
  { id: 'color-dodge', label: 'Renk soldur' },
  { id: 'color-burn', label: 'Renk yak' },
  { id: 'difference', label: 'Fark' },
]

export type BrushPreset = {
  /** 0 → feathered, 1 → crisp edge */
  hardness: number
  /** Distance between dabs as a fraction of the brush diameter */
  spacing: number
  /** Per-dab alpha; accumulates within a stroke, capped by the stroke opacity */
  flow: number
  /** How strongly pen pressure scales size (0 = ignore) */
  pressureSize: number
  /** How strongly pen pressure scales flow */
  pressureFlow: number
  /** Taper the start of a stroke (ink pens) */
  taper?: boolean
  /** Flat chisel tip for markers */
  chisel?: boolean
}

export const PRESETS: Record<Extract<ToolId, 'brush' | 'pencil' | 'airbrush' | 'ink' | 'marker' | 'eraser'>, BrushPreset> = {
  brush: { hardness: 0.65, spacing: 0.08, flow: 0.9, pressureSize: 0.75, pressureFlow: 0.3 },
  pencil: { hardness: 1, spacing: 0.05, flow: 1, pressureSize: 0.25, pressureFlow: 0.6 },
  airbrush: { hardness: 0, spacing: 0.04, flow: 0.06, pressureSize: 0.2, pressureFlow: 0.9 },
  ink: { hardness: 0.95, spacing: 0.04, flow: 1, pressureSize: 1, pressureFlow: 0, taper: true },
  marker: { hardness: 0.85, spacing: 0.06, flow: 0.5, pressureSize: 0.1, pressureFlow: 0.2, chisel: true },
  eraser: { hardness: 0.8, spacing: 0.06, flow: 1, pressureSize: 0.6, pressureFlow: 0.2 },
}

export function createCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function ctx2d(c: HTMLCanvasElement) {
  return c.getContext('2d', { willReadFrequently: false })!
}

/* ---------------------------------------------------------------- Colour */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`
}

export function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255)
}

export function hexToHsv(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max ? d / max : 0, max]
}

export function isHex(s: string) {
  return /^#?[0-9a-f]{6}$/i.test(s.trim())
}

/* ---------------------------------------------------------------- Dabs */

const dabCache = new Map<string, HTMLCanvasElement>()

/** A pre-rendered round (or chisel) brush tip. Cached per size/hardness/colour. */
function dabFor(diameter: number, hardness: number, color: string, chisel: boolean) {
  const size = Math.max(1, Math.round(diameter))
  const key = `${size}|${hardness.toFixed(2)}|${color}|${chisel ? 1 : 0}`
  const hit = dabCache.get(key)
  if (hit) return hit
  if (dabCache.size > 160) dabCache.clear()
  const pad = 2
  const c = createCanvas(size + pad * 2, size + pad * 2)
  const g = ctx2d(c)
  const r = size / 2
  const cx = r + pad
  const [R, G, B] = hexToRgb(color)
  if (chisel) {
    g.translate(cx, cx)
    g.rotate(-Math.PI / 5)
    g.fillStyle = `rgb(${R},${G},${B})`
    g.fillRect(-r, -r * 0.32, size, r * 0.64)
  } else if (hardness >= 0.98 || size <= 2) {
    g.fillStyle = `rgb(${R},${G},${B})`
    g.beginPath()
    g.arc(cx, cx, r, 0, Math.PI * 2)
    g.fill()
  } else {
    const grad = g.createRadialGradient(cx, cx, 0, cx, cx, r)
    grad.addColorStop(0, `rgba(${R},${G},${B},1)`)
    grad.addColorStop(Math.max(0.01, hardness * 0.98), `rgba(${R},${G},${B},1)`)
    grad.addColorStop(1, `rgba(${R},${G},${B},0)`)
    g.fillStyle = grad
    g.fillRect(0, 0, c.width, c.height)
  }
  dabCache.set(key, c)
  return c
}

export type StrokePoint = { x: number; y: number; p: number }

export type StrokeState = {
  last: StrokePoint | null
  carry: number
  travelled: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export function newStroke(): StrokeState {
  return { last: null, carry: 0, travelled: 0, bbox: { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity } }
}

/**
 * Stamps dabs between the previous and current point onto `target`.
 * `mirrorW` mirrors every dab across the vertical centre line (symmetry mode).
 */
export function strokeTo(
  target: CanvasRenderingContext2D,
  s: StrokeState,
  pt: StrokePoint,
  opts: { size: number; color: string; preset: BrushPreset; mirrorW?: number | null },
) {
  const { size, color, preset } = opts
  const from = s.last ?? pt
  const dx = pt.x - from.x
  const dy = pt.y - from.y
  const dist = Math.hypot(dx, dy)
  const step = Math.max(0.5, size * preset.spacing)
  const stamp = (x: number, y: number, p: number) => {
    let scale = 1 - preset.pressureSize + preset.pressureSize * p
    if (preset.taper) scale *= Math.min(1, 0.25 + s.travelled / (size * 6))
    const d = Math.max(1, size * scale)
    const tip = dabFor(d, preset.hardness, color, Boolean(preset.chisel))
    target.globalAlpha = Math.min(1, preset.flow * (1 - preset.pressureFlow + preset.pressureFlow * p))
    const half = tip.width / 2
    target.drawImage(tip, x - half, y - half)
    if (opts.mirrorW) target.drawImage(tip, opts.mirrorW - x - half, y - half)
    const b = s.bbox
    const xs = opts.mirrorW ? [x, opts.mirrorW - x] : [x]
    for (const xx of xs) {
      b.x0 = Math.min(b.x0, xx - half)
      b.x1 = Math.max(b.x1, xx + half)
    }
    b.y0 = Math.min(b.y0, y - half)
    b.y1 = Math.max(b.y1, y + half)
  }

  if (!s.last) {
    stamp(pt.x, pt.y, pt.p)
    s.last = pt
    return
  }
  let t = s.carry
  while (t <= dist) {
    const k = dist ? t / dist : 0
    s.travelled += step
    stamp(from.x + dx * k, from.y + dy * k, from.p + (pt.p - from.p) * k)
    t += step
  }
  s.carry = t - dist
  s.last = pt
  target.globalAlpha = 1
}

/* ---------------------------------------------------------------- Shapes */

export function drawShape(
  g: CanvasRenderingContext2D,
  tool: 'line' | 'rect' | 'ellipse',
  a: { x: number; y: number },
  b: { x: number; y: number },
  opts: { size: number; color: string; fill: boolean; mirrorW?: number | null },
) {
  const paint = (ax: number, bx: number) => {
    g.beginPath()
    if (tool === 'line') {
      g.moveTo(ax, a.y)
      g.lineTo(bx, b.y)
    } else if (tool === 'rect') {
      g.rect(Math.min(ax, bx), Math.min(a.y, b.y), Math.abs(bx - ax), Math.abs(b.y - a.y))
    } else {
      g.ellipse((ax + bx) / 2, (a.y + b.y) / 2, Math.abs(bx - ax) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2)
    }
    if (opts.fill && tool !== 'line') {
      g.fillStyle = opts.color
      g.fill()
    } else {
      g.strokeStyle = opts.color
      g.lineWidth = opts.size
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.stroke()
    }
  }
  paint(a.x, b.x)
  if (opts.mirrorW) paint(opts.mirrorW - a.x, opts.mirrorW - b.x)
}

/* ---------------------------------------------------------------- Flood fill */

/** Scanline flood fill on one layer. Returns false when the target already matches. */
export function floodFill(layer: HTMLCanvasElement, sx: number, sy: number, hex: string, tolerance: number, alpha: number) {
  const w = layer.width
  const h = layer.height
  const x0 = Math.floor(sx)
  const y0 = Math.floor(sy)
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return false
  const g = layer.getContext('2d', { willReadFrequently: true })!
  const img = g.getImageData(0, 0, w, h)
  const d = img.data
  const i0 = (y0 * w + x0) * 4
  const tr = d[i0]
  const tg = d[i0 + 1]
  const tb = d[i0 + 2]
  const ta = d[i0 + 3]
  const [fr, fg, fb] = hexToRgb(hex)
  const fa = Math.round(alpha * 255)
  if (tr === fr && tg === fg && tb === fb && ta === fa) return false
  const tol = tolerance * tolerance * 4
  const match = (i: number) => {
    const r = d[i] - tr
    const gg = d[i + 1] - tg
    const b = d[i + 2] - tb
    const a = d[i + 3] - ta
    return r * r + gg * gg + b * b + a * a <= tol
  }
  const seen = new Uint8Array(w * h)
  const stack: number[] = [x0, y0]
  while (stack.length) {
    const y = stack.pop()!
    let x = stack.pop()!
    while (x >= 0 && !seen[y * w + x] && match((y * w + x) * 4)) x--
    x++
    let up = false
    let down = false
    while (x < w && !seen[y * w + x] && match((y * w + x) * 4)) {
      const p = y * w + x
      seen[p] = 1
      const i = p * 4
      d[i] = fr
      d[i + 1] = fg
      d[i + 2] = fb
      d[i + 3] = fa
      if (y > 0) {
        const m = !seen[p - w] && match((p - w) * 4)
        if (m && !up) stack.push(x, y - 1)
        up = m
      }
      if (y < h - 1) {
        const m = !seen[p + w] && match((p + w) * 4)
        if (m && !down) stack.push(x, y + 1)
        down = m
      }
      x++
    }
  }
  // Grow the fill by one pixel so anti-aliased line art leaves no halo.
  const grown = new Uint8ClampedArray(d)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x
      if (seen[p]) continue
      if (seen[p - 1] || seen[p + 1] || seen[p - w] || seen[p + w]) {
        const i = p * 4
        if (d[i + 3] < 250) {
          grown[i] = fr
          grown[i + 1] = fg
          grown[i + 2] = fb
          grown[i + 3] = Math.max(d[i + 3], fa)
        }
      }
    }
  }
  img.data.set(grown)
  g.putImageData(img, 0, 0)
  return true
}

/* ---------------------------------------------------------------- Export */

export function canvasToDataUrl(c: HTMLCanvasElement, type: 'image/webp' | 'image/png', quality = 0.9) {
  const url = c.toDataURL(type, quality)
  // Safari can't encode WebP and silently returns PNG; that's fine, the server accepts both.
  return url
}

export function scaledCopy(src: HTMLCanvasElement, maxSide: number, background?: string) {
  const k = Math.min(1, maxSide / Math.max(src.width, src.height))
  const c = createCanvas(Math.max(1, Math.round(src.width * k)), Math.max(1, Math.round(src.height * k)))
  const g = ctx2d(c)
  if (background) {
    g.fillStyle = background
    g.fillRect(0, 0, c.width, c.height)
  }
  g.imageSmoothingQuality = 'high'
  g.drawImage(src, 0, 0, c.width, c.height)
  return c
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Görsel yüklenemedi'))
    img.src = src
  })
}
