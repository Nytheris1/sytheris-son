import 'server-only'
import jpeg from 'jpeg-js'
import { PNG } from 'pngjs'

/**
 * Turns plain-background character art (white or any flat colour) into a transparent cut-out,
 * so every character can stand in front of the showcase panel the way native PNG cut-outs do.
 *
 * The background colour is read from the image border, then flood-filled inwards from the edges:
 * only pixels connected to the border are removed, so white hair or clothing enclosed by line art survives.
 */

type Raster = { width: number; height: number; data: Uint8Array }

const MAX_PIXELS = 4_000_000
const TOLERANCE = 30
const FEATHER = 70

function decode(buf: Buffer, type: string): Raster | null {
  try {
    if (type.includes('png') || buf.subarray(1, 4).toString() === 'PNG') {
      const png = PNG.sync.read(buf)
      return { width: png.width, height: png.height, data: png.data }
    }
    const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxResolutionInMP: 40, maxMemoryUsageInMB: 512 })
    return { width: img.width, height: img.height, data: img.data }
  } catch {
    return null
  }
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 255
}

/** Returns the background mask (1 = background), or null when the art has no clean, flat background. */
function backgroundMask({ width: w, height: h, data: d }: Raster) {
  const n = w * h
  if (n > MAX_PIXELS || w < 64 || h < 64) return null

  const border: number[] = []
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1)

  const opaque = border.filter((i) => d[i * 4 + 3] > 16)
  const bg = [0, 1, 2].map((c) => median(opaque.map((i) => d[i * 4 + c])))
  const dist = (i: number) => Math.max(Math.abs(d[i * 4] - bg[0]), Math.abs(d[i * 4 + 1] - bg[1]), Math.abs(d[i * 4 + 2] - bg[2]))
  const isBg = (i: number) => d[i * 4 + 3] <= 16 || dist(i) < TOLERANCE

  const clean = border.filter(isBg).length / border.length
  if (clean < 0.7) return null

  const mask = new Uint8Array(n)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0
  for (const i of border) {
    if (!mask[i] && isBg(i)) {
      mask[i] = 1
      queue[tail++] = i
    }
  }
  while (head < tail) {
    const i = queue[head++]
    const x = i % w
    const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]
    for (const j of next) {
      if (j >= 0 && j < n && !mask[j] && isBg(j)) {
        mask[j] = 1
        queue[tail++] = j
      }
    }
  }

  if (!dropSpeckles(mask, w, h)) return null

  let bgCount = 0
  for (let i = 0; i < n; i++) bgCount += mask[i]
  const figure = 1 - bgCount / n
  if (figure < 0.06 || figure > 0.88) return null
  return { mask, bg, dist }
}

/**
 * Paper grain and JPEG noise leave tiny opaque islands floating around the figure after the flood fill.
 * Islands far smaller than the figure are folded into the background; if there are so many that the
 * background is clearly textured (not flat), the art is rejected so a cleaner candidate gets picked.
 */
function dropSpeckles(mask: Uint8Array, w: number, h: number) {
  const n = w * h
  const label = new Int32Array(n)
  const sizes: number[] = [0]
  const stack = new Int32Array(n)
  for (let start = 0; start < n; start++) {
    if (mask[start] || label[start]) continue
    const id = sizes.length
    let size = 0
    let top = 0
    stack[top++] = start
    label[start] = id
    while (top > 0) {
      const i = stack[--top]
      size++
      const x = i % w
      if (x > 0 && !mask[i - 1] && !label[i - 1]) (label[i - 1] = id), (stack[top++] = i - 1)
      if (x < w - 1 && !mask[i + 1] && !label[i + 1]) (label[i + 1] = id), (stack[top++] = i + 1)
      if (i >= w && !mask[i - w] && !label[i - w]) (label[i - w] = id), (stack[top++] = i - w)
      if (i < n - w && !mask[i + w] && !label[i + w]) (label[i + w] = id), (stack[top++] = i + w)
    }
    sizes.push(size)
  }
  const largest = Math.max(0, ...sizes)
  if (!largest) return false
  const keep = Math.max(300, largest * 0.02)
  let speckPixels = 0
  let speckCount = 0
  for (let id = 1; id < sizes.length; id++) {
    if (sizes[id] < keep) {
      speckPixels += sizes[id]
      speckCount++
    }
  }
  if (speckCount > 1500 || speckPixels > largest * 0.08) return false
  for (let i = 0; i < n; i++) if (!mask[i] && sizes[label[i]] < keep) mask[i] = 1
  return true
}

/** Cheap check used while choosing artwork: can this image be cut out cleanly? */
export function canCutOut(buf: Buffer, type: string) {
  const img = decode(buf, type)
  return Boolean(img && backgroundMask(img))
}

/** Transparent, tightly-cropped PNG of the figure, or null when the background isn't flat enough. */
export function cutOut(buf: Buffer, type: string): Buffer | null {
  const img = decode(buf, type)
  if (!img) return null
  const found = backgroundMask(img)
  if (!found) return null

  const { width: w, height: h, data: src } = img
  const { mask, bg, dist } = found
  const out = Buffer.from(src)
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const p = i * 4
      if (mask[i]) {
        out[p + 3] = 0
        continue
      }
      // Anti-aliased rim: fade pixels that border the background by how close they are to its colour,
      // and un-mix the background out of them so no white halo remains on a coloured panel.
      const rim = (x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) || (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w])
      if (rim) {
        const a = Math.min(1, Math.max(0, (dist(i) - TOLERANCE * 0.4) / FEATHER))
        if (a < 0.04) {
          out[p + 3] = 0
          continue
        }
        for (let c = 0; c < 3; c++) out[p + c] = Math.max(0, Math.min(255, Math.round((src[p + c] - bg[c] * (1 - a)) / a)))
        out[p + 3] = Math.round(src[p + 3] * a)
      }
      if (out[p + 3] > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null

  const pad = 4
  const left = Math.max(0, minX - pad)
  const top = Math.max(0, minY - pad)
  const cw = Math.min(w, maxX + pad + 1) - left
  const ch = Math.min(h, maxY + pad + 1) - top

  const png = new PNG({ width: cw, height: ch })
  for (let y = 0; y < ch; y++) {
    const from = ((top + y) * w + left) * 4
    out.copy(png.data, y * cw * 4, from, from + cw * 4)
  }
  return PNG.sync.write(png, { colorType: 6, deflateLevel: 6 })
}
