'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  FilePlus2,
  FlipHorizontal2,
  GalleryVerticalEnd,
  Loader2,
  Maximize,
  Minus,
  Plus,
  Redo2,
  Save,
  SlidersHorizontal,
  SplitSquareHorizontal,
  Undo2,
  X,
} from 'lucide-react'
import { discardStudioDraft, publishArtwork, saveStudioDraft } from '@/app/actions/studio'
import type { Draft } from '@/lib/artworks'
import {
  PRESETS,
  canvasToDataUrl,
  createCanvas,
  ctx2d,
  drawShape,
  floodFill,
  loadImage,
  newStroke,
  rgbToHex,
  scaledCopy,
  strokeTo,
  type BlendMode,
  type BrushPreset,
  type StrokeState,
  type ToolId,
} from '@/lib/studio/engine'
import { cn } from '@/lib/utils'
import { ColorPicker } from './color-picker'
import { LayersPanel, type LayerMeta } from './layers-panel'
import { PublishDialog } from './publish-dialog'
import { TOOLS, ToolRail } from './tool-rail'

const MAX_LAYERS = 16
const HISTORY = 40
const DOC_PRESETS = [
  { label: 'Yatay', w: 1600, h: 1000 },
  { label: 'Kare', w: 1200, h: 1200 },
  { label: 'Dikey', w: 1000, h: 1500 },
]
const IMAGE_LIMIT = 2_200_000 * 1.37
const DRAFT_LIMIT = 5_400_000 * 1.37

type BrushTool = keyof typeof PRESETS
const BRUSH_TOOLS = new Set<ToolId>(['brush', 'pencil', 'airbrush', 'ink', 'marker', 'eraser'])
const SHAPE_TOOLS = new Set<ToolId>(['line', 'rect', 'ellipse'])

type PxEntry = { kind: 'px'; layerId: string; x: number; y: number; before: ImageData; after?: ImageData }
type Snapshot = { layers: LayerMeta[]; activeId: string; map: Map<string, HTMLCanvasElement> }
type StructEntry = { kind: 'struct'; before: Snapshot; after?: Snapshot }
type Entry = PxEntry | StructEntry

type Drawing = {
  layerId: string
  tool: ToolId
  erase: boolean
  opacity: number
  size: number
  color: string
  preset: BrushPreset | null
  stroke: StrokeState
  smooth: { x: number; y: number }
  raw: { x: number; y: number; p: number }
  shapeStart: { x: number; y: number } | null
  startedAt: number
}

const uid = () => Math.random().toString(36).slice(2, 10)

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null
  return Boolean(el?.closest('input, textarea, select, [contenteditable="true"]'))
}

function Slider({ id, label, value, min, max, step = 1, suffix = '', onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </label>
        <span className="font-mono text-[11px] tabular-nums text-foreground/80">
          {value}
          {suffix}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="studio-range w-full" />
    </div>
  )
}

function TopButton({ label, onClick, disabled, active, children, className }: { label: string; onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-lg transition disabled:pointer-events-none disabled:opacity-30',
        active ? 'bg-primary/15 text-ink' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function StudioEditor({ draft, artist }: { draft: Draft | null; artist: string }) {
  const router = useRouter()
  const viewportRef = useRef<HTMLDivElement>(null)
  const displayRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const coordsRef = useRef<HTMLSpanElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canvases = useRef(new Map<string, HTMLCanvasElement>())
  const buffers = useRef<{ stroke: HTMLCanvasElement; scratch: HTMLCanvasElement; before: HTMLCanvasElement } | null>(null)
  const history = useRef<Entry[]>([])
  const future = useRef<Entry[]>([])
  const drawing = useRef<Drawing | null>(null)
  const panning = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; zoom: number; cx: number; cy: number; px: number; py: number } | null>(null)
  const spaceHeld = useRef(false)
  const raf = useRef(0)
  const effort = useRef(0)
  const thumbTimer = useRef(0)

  const [doc, setDoc] = useState({ w: draft?.w ?? 1600, h: draft?.h ?? 1000 })
  const [layers, setLayers] = useState<LayerMeta[]>([])
  const [activeId, setActiveId] = useState('')
  const layersRef = useRef<LayerMeta[]>([])
  const activeRef = useRef('')
  const docRef = useRef(doc)
  const [ready, setReady] = useState(false)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  const [tool, setTool] = useState<ToolId>('brush')
  const [color, setColor] = useState('#e83f3f')
  const [secondary, setSecondary] = useState('#111014')
  const [recent, setRecent] = useState<string[]>([])
  const [sizes, setSizes] = useState<Record<string, number>>({ brush: 18, pencil: 4, ink: 8, airbrush: 70, marker: 26, eraser: 40, line: 6, rect: 6, ellipse: 6 })
  const [opacity, setOpacity] = useState(100)
  const [smoothing, setSmoothing] = useState(35)
  const [tolerance, setTolerance] = useState(28)
  const [shapeFill, setShapeFill] = useState(false)

  const [zoom, setZoom] = useState(0.5)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [mirror, setMirror] = useState(false)
  const [symmetry, setSymmetry] = useState(false)

  const [histTick, setHistTick] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(draft?.at ?? null)
  const [title, setTitle] = useState(draft?.title && draft.title !== 'İsimsiz eser' ? draft.title : '')
  const [panelOpen, setPanelOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishPreview, setPublishPreview] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  const mirrorRef = useRef(mirror)
  useEffect(() => {
    zoomRef.current = zoom
    panRef.current = pan
    mirrorRef.current = mirror
  }, [zoom, pan, mirror])

  const commitLayers = useCallback((next: LayerMeta[]) => {
    layersRef.current = next
    setLayers(next)
  }, [])
  const commitActive = useCallback((id: string) => {
    activeRef.current = id
    setActiveId(id)
  }, [])

  /* ------------------------------------------------------------ Rendering */

  const composite = useCallback(() => {
    const display = displayRef.current
    const buf = buffers.current
    if (!display || !buf) return
    const g = ctx2d(display)
    const { w, h } = docRef.current
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 1
    g.clearRect(0, 0, w, h)
    const d = drawing.current
    for (const l of layersRef.current) {
      if (!l.visible) continue
      let src = canvases.current.get(l.id)
      if (!src) continue
      if (d && d.layerId === l.id) {
        const sg = ctx2d(buf.scratch)
        sg.globalCompositeOperation = 'source-over'
        sg.globalAlpha = 1
        sg.clearRect(0, 0, w, h)
        sg.drawImage(src, 0, 0)
        sg.globalAlpha = d.opacity
        sg.globalCompositeOperation = d.erase ? 'destination-out' : 'source-over'
        sg.drawImage(buf.stroke, 0, 0)
        sg.globalAlpha = 1
        sg.globalCompositeOperation = 'source-over'
        src = buf.scratch
      }
      g.globalAlpha = l.opacity
      g.globalCompositeOperation = l.blend
      g.drawImage(src, 0, 0)
    }
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
  }, [])

  const schedule = useCallback(() => {
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      composite()
    })
  }, [composite])

  const refreshThumbs = useCallback((ids?: string[]) => {
    window.clearTimeout(thumbTimer.current)
    thumbTimer.current = window.setTimeout(() => {
      setThumbs((prev) => {
        const next: Record<string, string> = {}
        for (const l of layersRef.current) {
          const c = canvases.current.get(l.id)
          if (!c) continue
          next[l.id] = !ids || ids.includes(l.id) || !prev[l.id] ? scaledCopy(c, 96).toDataURL('image/png') : prev[l.id]
        }
        return next
      })
    }, 220)
  }, [])

  const markDirty = useCallback(() => setDirty(true), [])

  /* ------------------------------------------------------------ Setup */

  const fit = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return
    const { w, h } = docRef.current
    const pad = window.innerWidth < 640 ? 24 : 72
    const z = Math.min((vp.clientWidth - pad) / w, (vp.clientHeight - pad) / h, 1)
    setZoom(Math.max(0.05, z))
    setPan({ x: 0, y: 0 })
  }, [])

  const initDoc = useCallback(
    async (w: number, h: number, source: Draft | null) => {
      setReady(false)
      docRef.current = { w, h }
      setDoc({ w, h })
      buffers.current = { stroke: createCanvas(w, h), scratch: createCanvas(w, h), before: createCanvas(w, h) }
      const map = new Map<string, HTMLCanvasElement>()
      let metas: LayerMeta[] = []
      if (source?.layers.length) {
        for (const l of source.layers) {
          const c = createCanvas(w, h)
          try {
            const img = await loadImage(l.data)
            ctx2d(c).drawImage(img, 0, 0, w, h)
          } catch {}
          const id = l.id || uid()
          map.set(id, c)
          metas.push({ id, name: l.name, visible: l.visible, opacity: l.opacity, blend: l.blend as BlendMode })
        }
      } else {
        const bg = createCanvas(w, h)
        const bgCtx = ctx2d(bg)
        bgCtx.fillStyle = '#ffffff'
        bgCtx.fillRect(0, 0, w, h)
        const bgId = uid()
        const firstId = uid()
        map.set(bgId, bg)
        map.set(firstId, createCanvas(w, h))
        metas = [
          { id: bgId, name: 'Arka plan', visible: true, opacity: 1, blend: 'source-over' },
          { id: firstId, name: 'Katman 1', visible: true, opacity: 1, blend: 'source-over' },
        ]
      }
      canvases.current = map
      history.current = []
      future.current = []
      setHistTick((t) => t + 1)
      commitLayers(metas)
      commitActive(metas[metas.length - 1].id)
      setReady(true)
      requestAnimationFrame(() => {
        fit()
        composite()
        refreshThumbs()
      })
    },
    [commitActive, commitLayers, composite, fit, refreshThumbs],
  )

  useEffect(() => {
    initDoc(draft?.w ?? 1600, draft?.h ?? 1000, draft)
    // Runs once with the server-provided draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    schedule()
  }, [layers, schedule])

  useEffect(() => {
    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [fit])

  useEffect(() => {
    if (!dirty) return
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBefore)
    return () => window.removeEventListener('beforeunload', onBefore)
  }, [dirty])

  /* ------------------------------------------------------------ History */

  const snapshot = useCallback((): Snapshot => ({ layers: layersRef.current.map((l) => ({ ...l })), activeId: activeRef.current, map: new Map(canvases.current) }), [])
  const restore = useCallback(
    (s: Snapshot) => {
      canvases.current = new Map(s.map)
      commitLayers(s.layers.map((l) => ({ ...l })))
      commitActive(s.activeId)
    },
    [commitActive, commitLayers],
  )

  const push = useCallback((e: Entry) => {
    history.current.push(e)
    if (history.current.length > HISTORY) history.current.shift()
    future.current = []
    setHistTick((t) => t + 1)
  }, [])

  const pushStruct = useCallback(() => push({ kind: 'struct', before: snapshot() }), [push, snapshot])

  const undo = useCallback(() => {
    const e = history.current.pop()
    if (!e) return
    if (e.kind === 'px') {
      const c = canvases.current.get(e.layerId)
      if (c) {
        const g = c.getContext('2d', { willReadFrequently: true })!
        e.after = g.getImageData(e.x, e.y, e.before.width, e.before.height)
        g.putImageData(e.before, e.x, e.y)
        refreshThumbs([e.layerId])
      }
    } else {
      e.after = snapshot()
      restore(e.before)
      refreshThumbs()
    }
    future.current.push(e)
    setHistTick((t) => t + 1)
    markDirty()
    schedule()
  }, [markDirty, refreshThumbs, restore, schedule, snapshot])

  const redo = useCallback(() => {
    const e = future.current.pop()
    if (!e) return
    if (e.kind === 'px') {
      const c = canvases.current.get(e.layerId)
      if (c && e.after) {
        const g = c.getContext('2d', { willReadFrequently: true })!
        e.before = g.getImageData(e.x, e.y, e.after.width, e.after.height)
        g.putImageData(e.after, e.x, e.y)
        refreshThumbs([e.layerId])
      }
    } else if (e.after) {
      e.before = snapshot()
      restore(e.after)
      refreshThumbs()
    }
    history.current.push(e)
    setHistTick((t) => t + 1)
    markDirty()
    schedule()
  }, [markDirty, refreshThumbs, restore, schedule, snapshot])

  const canUndo = useMemo(() => history.current.length > 0, [histTick]) // eslint-disable-line react-hooks/exhaustive-deps
  const canRedo = useMemo(() => future.current.length > 0, [histTick]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ Layer ops */

  const activeLayer = layers.find((l) => l.id === activeId)

  const addLayer = useCallback(
    (name?: string, canvas?: HTMLCanvasElement) => {
      if (layersRef.current.length >= MAX_LAYERS) {
        toast.error(`En fazla ${MAX_LAYERS} katman kullanabilirsin.`)
        return
      }
      pushStruct()
      const id = uid()
      canvases.current.set(id, canvas ?? createCanvas(docRef.current.w, docRef.current.h))
      const list = [...layersRef.current]
      const at = Math.max(0, list.findIndex((l) => l.id === activeRef.current)) + 1
      const n = list.length
      list.splice(at, 0, { id, name: name ?? `Katman ${n}`, visible: true, opacity: 1, blend: 'source-over' })
      commitLayers(list)
      commitActive(id)
      markDirty()
      refreshThumbs([id])
    },
    [commitActive, commitLayers, markDirty, pushStruct, refreshThumbs],
  )

  const duplicateLayer = useCallback(() => {
    const src = canvases.current.get(activeRef.current)
    const meta = layersRef.current.find((l) => l.id === activeRef.current)
    if (!src || !meta) return
    const copy = createCanvas(src.width, src.height)
    ctx2d(copy).drawImage(src, 0, 0)
    addLayer(`${meta.name} kopya`.slice(0, 32), copy)
  }, [addLayer])

  const deleteLayer = useCallback(() => {
    const list = layersRef.current
    if (list.length <= 1) return
    pushStruct()
    const idx = list.findIndex((l) => l.id === activeRef.current)
    const next = list.filter((l) => l.id !== activeRef.current)
    canvases.current.delete(activeRef.current)
    commitLayers(next)
    commitActive(next[Math.max(0, idx - 1)].id)
    markDirty()
  }, [commitActive, commitLayers, markDirty, pushStruct])

  const moveLayer = useCallback(
    (dir: 1 | -1) => {
      const list = [...layersRef.current]
      const idx = list.findIndex((l) => l.id === activeRef.current)
      const to = idx + dir
      if (to < 0 || to >= list.length) return
      pushStruct()
      ;[list[idx], list[to]] = [list[to], list[idx]]
      commitLayers(list)
      markDirty()
    },
    [commitLayers, markDirty, pushStruct],
  )

  const mergeDown = useCallback(() => {
    const list = layersRef.current
    const idx = list.findIndex((l) => l.id === activeRef.current)
    if (idx <= 0) return
    const upper = list[idx]
    const lower = list[idx - 1]
    const up = canvases.current.get(upper.id)
    const low = canvases.current.get(lower.id)
    if (!up || !low) return
    pushStruct()
    const merged = createCanvas(low.width, low.height)
    const g = ctx2d(merged)
    if (lower.visible) {
      g.globalAlpha = lower.opacity
      g.drawImage(low, 0, 0)
    }
    if (upper.visible) {
      g.globalAlpha = upper.opacity
      g.globalCompositeOperation = upper.blend
      g.drawImage(up, 0, 0)
    }
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
    canvases.current.set(lower.id, merged)
    canvases.current.delete(upper.id)
    commitLayers(list.filter((l) => l.id !== upper.id).map((l) => (l.id === lower.id ? { ...l, opacity: 1, visible: true } : l)))
    commitActive(lower.id)
    markDirty()
    refreshThumbs([lower.id])
  }, [commitActive, commitLayers, markDirty, pushStruct, refreshThumbs])

  const clearLayer = useCallback(() => {
    const c = canvases.current.get(activeRef.current)
    if (!c) return
    const g = c.getContext('2d', { willReadFrequently: true })!
    push({ kind: 'px', layerId: activeRef.current, x: 0, y: 0, before: g.getImageData(0, 0, c.width, c.height) })
    g.clearRect(0, 0, c.width, c.height)
    markDirty()
    schedule()
    refreshThumbs([activeRef.current])
  }, [markDirty, push, refreshThumbs, schedule])

  const patchLayer = useCallback(
    (id: string, patch: Partial<LayerMeta>) => {
      commitLayers(layersRef.current.map((l) => (l.id === id ? { ...l, ...patch } : l)))
      markDirty()
    },
    [commitLayers, markDirty],
  )

  const importImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return toast.error('Yalnızca görsel dosyaları içe aktarılabilir.')
      if (file.size > 12 * 1024 * 1024) return toast.error('Görsel 12 MB’tan küçük olmalı.')
      const url = URL.createObjectURL(file)
      try {
        const img = await loadImage(url)
        const { w, h } = docRef.current
        const c = createCanvas(w, h)
        const k = Math.min(w / img.width, h / img.height, 1)
        const dw = img.width * k
        const dh = img.height * k
        ctx2d(c).drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
        addLayer(file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'Referans', c)
        toast.success('Görsel yeni katman olarak eklendi')
      } catch {
        toast.error('Görsel okunamadı.')
      } finally {
        URL.revokeObjectURL(url)
      }
    },
    [addLayer],
  )

  /* ------------------------------------------------------------ Colour */

  const pickColor = useCallback((hex: string) => {
    setColor(hex)
  }, [])

  const rememberColor = useCallback((hex: string) => {
    setRecent((r) => [hex, ...r.filter((c) => c !== hex)].slice(0, 10))
  }, [])

  /* ------------------------------------------------------------ Pointer */

  const toDoc = useCallback((clientX: number, clientY: number) => {
    const display = displayRef.current!
    const r = display.getBoundingClientRect()
    const { w, h } = docRef.current
    let x = ((clientX - r.left) / r.width) * w
    if (mirrorRef.current) x = w - x
    const y = ((clientY - r.top) / r.height) * h
    return { x, y }
  }, [])

  const updateCursor = useCallback(
    (clientX: number, clientY: number) => {
      const vp = viewportRef.current
      const cur = cursorRef.current
      if (!vp) return
      const r = vp.getBoundingClientRect()
      if (cur) {
        const d = Math.max(4, (sizes[tool] ?? 10) * zoomRef.current)
        cur.style.width = `${d}px`
        cur.style.height = `${d}px`
        cur.style.transform = `translate(${clientX - r.left - d / 2}px, ${clientY - r.top - d / 2}px)`
      }
      if (coordsRef.current && displayRef.current) {
        const p = toDoc(clientX, clientY)
        const { w, h } = docRef.current
        coordsRef.current.textContent = p.x >= 0 && p.y >= 0 && p.x <= w && p.y <= h ? `${Math.round(p.x)}, ${Math.round(p.y)}` : '—'
      }
    },
    [sizes, tool, toDoc],
  )

  const sample = useCallback(
    (clientX: number, clientY: number) => {
      const display = displayRef.current
      if (!display) return
      const { x, y } = toDoc(clientX, clientY)
      const { w, h } = docRef.current
      if (x < 0 || y < 0 || x >= w || y >= h) return
      const px = display.getContext('2d', { willReadFrequently: true })!.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
      if (px[3] === 0) return
      const hex = rgbToHex(px[0], px[1], px[2])
      setColor(hex)
      rememberColor(hex)
    },
    [rememberColor, toDoc],
  )

  const cancelStroke = useCallback(() => {
    if (!drawing.current || !buffers.current) return
    ctx2d(buffers.current.stroke).clearRect(0, 0, docRef.current.w, docRef.current.h)
    drawing.current = null
    schedule()
  }, [schedule])

  const commitStroke = useCallback(() => {
    const d = drawing.current
    const buf = buffers.current
    if (!d || !buf) return
    const layer = canvases.current.get(d.layerId)
    const { w, h } = docRef.current
    if (!layer) {
      cancelStroke()
      return
    }
    let { x0, y0, x1, y1 } = d.stroke.bbox
    if (d.shapeStart) {
      const pad = d.size + 4
      const xs = [d.shapeStart.x, d.raw.x]
      if (symmetry) xs.push(w - d.shapeStart.x, w - d.raw.x)
      x0 = Math.min(...xs) - pad
      x1 = Math.max(...xs) + pad
      y0 = Math.min(d.shapeStart.y, d.raw.y) - pad
      y1 = Math.max(d.shapeStart.y, d.raw.y) + pad
    }
    const bx = Math.max(0, Math.floor(x0))
    const by = Math.max(0, Math.floor(y0))
    const bw = Math.min(w, Math.ceil(x1)) - bx
    const bh = Math.min(h, Math.ceil(y1)) - by
    if (bw > 0 && bh > 0) {
      const before = buf.before.getContext('2d', { willReadFrequently: true })!.getImageData(bx, by, bw, bh)
      const g = ctx2d(layer)
      g.globalAlpha = d.opacity
      g.globalCompositeOperation = d.erase ? 'destination-out' : 'source-over'
      g.drawImage(buf.stroke, 0, 0)
      g.globalAlpha = 1
      g.globalCompositeOperation = 'source-over'
      push({ kind: 'px', layerId: d.layerId, x: bx, y: by, before })
      markDirty()
      refreshThumbs([d.layerId])
      if (!d.erase) rememberColor(d.color)
    }
    effort.current += (performance.now() - d.startedAt) / 1000
    ctx2d(buf.stroke).clearRect(0, 0, w, h)
    drawing.current = null
    schedule()
  }, [cancelStroke, markDirty, push, refreshThumbs, rememberColor, schedule, symmetry])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready) return
    const vp = viewportRef.current!
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try {
      vp.setPointerCapture(e.pointerId)
    } catch {
      // Pointer already released (fast taps on some touch screens); drawing still works without capture.
    }

    if (pointers.current.size === 2) {
      cancelStroke()
      const [a, b] = [...pointers.current.values()]
      const r = vp.getBoundingClientRect()
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom: zoomRef.current,
        cx: (a.x + b.x) / 2 - (r.left + r.width / 2),
        cy: (a.y + b.y) / 2 - (r.top + r.height / 2),
        px: panRef.current.x,
        py: panRef.current.y,
      }
      return
    }

    if (e.button === 1 || spaceHeld.current || tool === 'pan') {
      panning.current = { x: e.clientX, y: e.clientY, px: panRef.current.x, py: panRef.current.y }
      return
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return

    if (tool === 'picker' || e.altKey) {
      sample(e.clientX, e.clientY)
      return
    }

    const layerMeta = layersRef.current.find((l) => l.id === activeRef.current)
    const layer = canvases.current.get(activeRef.current)
    if (!layerMeta || !layer || !buffers.current) return
    if (!layerMeta.visible) {
      toast('Gizli bir katmana çizemezsin', { description: 'Önce katmanın göz simgesine tıklayıp görünür yap.' })
      return
    }

    const pt = toDoc(e.clientX, e.clientY)

    if (tool === 'fill') {
      const g = layer.getContext('2d', { willReadFrequently: true })!
      const before = g.getImageData(0, 0, layer.width, layer.height)
      if (floodFill(layer, pt.x, pt.y, color, tolerance, opacity / 100)) {
        push({ kind: 'px', layerId: activeRef.current, x: 0, y: 0, before })
        markDirty()
        schedule()
        refreshThumbs([activeRef.current])
        rememberColor(color)
      }
      return
    }

    if (!BRUSH_TOOLS.has(tool) && !SHAPE_TOOLS.has(tool)) return
    const buf = buffers.current
    const bg = ctx2d(buf.before)
    bg.clearRect(0, 0, docRef.current.w, docRef.current.h)
    bg.drawImage(layer, 0, 0)
    ctx2d(buf.stroke).clearRect(0, 0, docRef.current.w, docRef.current.h)
    const pressure = e.pointerType === 'mouse' ? 1 : e.pressure || 0.5
    drawing.current = {
      layerId: activeRef.current,
      tool,
      erase: tool === 'eraser',
      opacity: opacity / 100,
      size: sizes[tool] ?? 10,
      color: tool === 'eraser' ? '#000000' : color,
      preset: BRUSH_TOOLS.has(tool) ? PRESETS[tool as BrushTool] : null,
      stroke: newStroke(),
      smooth: { x: pt.x, y: pt.y },
      raw: { ...pt, p: pressure },
      shapeStart: SHAPE_TOOLS.has(tool) ? pt : null,
      startedAt: performance.now(),
    }
    if (drawing.current.preset) {
      strokeTo(ctx2d(buf.stroke), drawing.current.stroke, { ...pt, p: pressure }, { size: drawing.current.size, color: drawing.current.color, preset: drawing.current.preset, mirrorW: symmetry ? docRef.current.w : null })
    }
    schedule()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateCursor(e.clientX, e.clientY)
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const p = pinch.current
      const z = Math.min(8, Math.max(0.05, (p.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / p.dist))
      const vp = viewportRef.current!.getBoundingClientRect()
      const cx = (a.x + b.x) / 2 - (vp.left + vp.width / 2)
      const cy = (a.y + b.y) / 2 - (vp.top + vp.height / 2)
      setZoom(z)
      setPan({ x: cx - (p.cx - p.px) * (z / p.zoom), y: cy - (p.cy - p.py) * (z / p.zoom) })
      return
    }

    if (panning.current) {
      const p = panning.current
      setPan({ x: p.px + e.clientX - p.x, y: p.py + e.clientY - p.y })
      return
    }

    const d = drawing.current
    const buf = buffers.current
    if (!d || !buf) return
    const sg = ctx2d(buf.stroke)
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : []
    const list = events.length ? events : [e.nativeEvent]

    if (d.shapeStart) {
      const last = list[list.length - 1]
      let pt = toDoc(last.clientX, last.clientY)
      if (e.shiftKey) {
        const dx = pt.x - d.shapeStart.x
        const dy = pt.y - d.shapeStart.y
        if (d.tool === 'line') {
          const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
          const len = Math.hypot(dx, dy)
          pt = { x: d.shapeStart.x + Math.cos(ang) * len, y: d.shapeStart.y + Math.sin(ang) * len }
        } else {
          const m = Math.max(Math.abs(dx), Math.abs(dy))
          pt = { x: d.shapeStart.x + Math.sign(dx || 1) * m, y: d.shapeStart.y + Math.sign(dy || 1) * m }
        }
      }
      d.raw = { ...pt, p: 1 }
      sg.clearRect(0, 0, docRef.current.w, docRef.current.h)
      drawShape(sg, d.tool as 'line' | 'rect' | 'ellipse', d.shapeStart, pt, { size: d.size, color: d.color, fill: shapeFill, mirrorW: symmetry ? docRef.current.w : null })
      schedule()
      return
    }

    if (!d.preset) return
    const k = 1 - (smoothing / 100) * 0.88
    for (const ev of list) {
      const pt = toDoc(ev.clientX, ev.clientY)
      const p = ev.pointerType === 'mouse' ? 1 : ev.pressure || 0.5
      d.raw = { ...pt, p }
      d.smooth.x += (pt.x - d.smooth.x) * k
      d.smooth.y += (pt.y - d.smooth.y) * k
      strokeTo(sg, d.stroke, { x: d.smooth.x, y: d.smooth.y, p }, { size: d.size, color: d.color, preset: d.preset, mirrorW: symmetry ? docRef.current.w : null })
    }
    schedule()
  }

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pinch.current) {
      if (pointers.current.size < 2) pinch.current = null
      return
    }
    if (panning.current) {
      panning.current = null
      return
    }
    const d = drawing.current
    if (d?.preset && buffers.current) {
      strokeTo(ctx2d(buffers.current.stroke), d.stroke, d.raw, { size: d.size, color: d.color, preset: d.preset, mirrorW: symmetry ? docRef.current.w : null })
    }
    if (d) commitStroke()
  }

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = vp.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        const z0 = zoomRef.current
        const z = Math.min(8, Math.max(0.05, z0 * Math.exp(-e.deltaY * 0.0018)))
        const cx = e.clientX - (r.left + r.width / 2)
        const cy = e.clientY - (r.top + r.height / 2)
        const p = panRef.current
        setZoom(z)
        setPan({ x: cx - (cx - p.x) * (z / z0), y: cy - (cy - p.y) * (z / z0) })
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }
    }
    vp.addEventListener('wheel', onWheel, { passive: false })
    return () => vp.removeEventListener('wheel', onWheel)
  }, [])

  const zoomBy = useCallback((f: number) => {
    const z0 = zoomRef.current
    const z = Math.min(8, Math.max(0.05, z0 * f))
    setZoom(z)
    setPan((p) => ({ x: p.x * (z / z0), y: p.y * (z / z0) }))
  }, [])

  /* ------------------------------------------------------------ Output */

  const flatten = useCallback((background?: string) => {
    const { w, h } = docRef.current
    const c = createCanvas(w, h)
    const g = ctx2d(c)
    if (background) {
      g.fillStyle = background
      g.fillRect(0, 0, w, h)
    }
    for (const l of layersRef.current) {
      const src = canvases.current.get(l.id)
      if (!l.visible || !src) continue
      g.globalAlpha = l.opacity
      g.globalCompositeOperation = l.blend
      g.drawImage(src, 0, 0)
    }
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
    return c
  }, [])

  const saveDraft = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const encode = (type: 'image/png' | 'image/webp', q?: number) =>
        layersRef.current.map((l) => ({ ...l, data: canvasToDataUrl(canvases.current.get(l.id)!, type, q) }))
      let out = encode('image/png')
      if (out.reduce((s, l) => s + l.data.length, 0) > DRAFT_LIMIT) out = encode('image/webp', 0.92)
      if (out.reduce((s, l) => s + l.data.length, 0) > DRAFT_LIMIT) {
        toast.error('Taslak çok büyük', { description: 'Birkaç katmanı birleştirip tekrar dene.' })
        return
      }
      const { w, h } = docRef.current
      const res = await saveStudioDraft({ w, h, layers: out, at: Date.now(), title })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setSavedAt(res.at)
      setDirty(false)
      toast.success('Taslak kaydedildi', { description: 'Hangi cihazdan girersen gir, kaldığın yerden devam edersin.' })
    } catch {
      toast.error('Taslak kaydedilemedi. Bağlantını kontrol edip tekrar dene.')
    } finally {
      setSaving(false)
    }
  }, [saving, title])

  const downloadPng = useCallback(() => {
    const c = flatten()
    c.toBlob((blob) => {
      if (!blob) return toast.error('Görsel hazırlanamadı.')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(title || 'sytheris-atolye').replace(/[^\p{L}\p{N}-]+/gu, '-').toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    }, 'image/png')
  }, [flatten, title])

  const openPublish = useCallback(() => {
    setPublishPreview(scaledCopy(flatten('#ffffff'), 900).toDataURL('image/webp', 0.85))
    setPublishOpen(true)
  }, [flatten])

  const publish = useCallback(
    async (name: string) => {
      setPublishing(true)
      try {
        const flat = flatten('#ffffff')
        const big = scaledCopy(flat, 1800)
        let image = ''
        for (const q of [0.9, 0.82, 0.72, 0.6, 0.48]) {
          image = canvasToDataUrl(big, 'image/webp', q)
          if (image.length < IMAGE_LIMIT) break
        }
        if (image.length >= IMAGE_LIMIT) image = canvasToDataUrl(scaledCopy(flat, 1200), 'image/webp', 0.7)
        const thumb = canvasToDataUrl(scaledCopy(flat, 560), 'image/webp', 0.8)
        const res = await publishArtwork({ title: name, image, thumb, width: big.width, height: big.height, effort: effort.current, layers: layersRef.current.length })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        setTitle(name)
        setPublishOpen(false)
        toast.success('Eserin galeride!', { description: 'Atölye galerisinde herkes görebilir.' })
        if (res.awarded) toast.success('Yeni rozet: Atölye Sanatçısı', { description: 'Profilinde artık parlıyor.' })
        router.push(`/atolye?eser=${res.id}`)
      } catch {
        toast.error('Sergilenemedi. Bağlantını kontrol edip tekrar dene.')
      } finally {
        setPublishing(false)
      }
    },
    [flatten, router],
  )

  const newDocument = useCallback(
    async (w: number, h: number) => {
      if (dirty && !window.confirm('Kaydedilmemiş değişiklikler kaybolacak. Yeni tuval açılsın mı?')) return
      setNewOpen(false)
      await initDoc(w, h, null)
      setTitle('')
      setDirty(false)
      effort.current = 0
      discardStudioDraft().catch(() => {})
    },
    [dirty, initDoc],
  )

  /* ------------------------------------------------------------ Keyboard */

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (k === ' ' && !spaceHeld.current) {
        spaceHeld.current = true
        viewportRef.current?.classList.add('cursor-grab')
        e.preventDefault()
        return
      }
      if (mod && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && k === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (mod && k === 's') {
        e.preventDefault()
        saveDraft()
        return
      }
      if (mod && e.shiftKey && k === 'n') {
        e.preventDefault()
        addLayer()
        return
      }
      if (mod && k === 'j') {
        e.preventDefault()
        duplicateLayer()
        return
      }
      if (mod && k === 'e') {
        e.preventDefault()
        mergeDown()
        return
      }
      if (mod) return
      if (k === 'delete' || k === 'backspace') {
        clearLayer()
        return
      }
      if (k === '[' || k === ']') {
        setSizes((s) => {
          const cur = s[tool] ?? 10
          const next = k === '[' ? Math.max(1, Math.round(cur * 0.85)) : Math.min(400, Math.round(cur * 1.18) + 1)
          return { ...s, [tool]: next }
        })
        return
      }
      if (k === 'x') {
        setColor(secondary)
        setSecondary(color)
        return
      }
      if (k === '0') return fit()
      if (k === '+' || k === '=') return zoomBy(1.25)
      if (k === '-') return zoomBy(0.8)
      if (k === 'f') return setMirror((m) => !m)
      if (k === 'y') return setSymmetry((s) => !s)
      const t = TOOLS.find((x) => x.key.toLowerCase() === k)
      if (t) setTool(t.id)
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceHeld.current = false
        viewportRef.current?.classList.remove('cursor-grab')
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [addLayer, clearLayer, color, duplicateLayer, fit, mergeDown, redo, saveDraft, secondary, tool, undo, zoomBy])

  /* ------------------------------------------------------------ UI */

  const toolMeta = TOOLS.find((t) => t.id === tool)!
  const showBrushCursor = BRUSH_TOOLS.has(tool)
  const cursorClass = tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : tool === 'picker' || tool === 'fill' || SHAPE_TOOLS.has(tool) ? 'cursor-crosshair' : 'cursor-none'

  const panel = (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4" aria-labelledby="tool-settings">
        <h2 id="tool-settings" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <toolMeta.icon className="size-3.5" aria-hidden="true" /> {toolMeta.label}
        </h2>
        {(BRUSH_TOOLS.has(tool) || SHAPE_TOOLS.has(tool)) && (
          <Slider id="tool-size" label="Boyut" value={sizes[tool] ?? 10} min={1} max={400} suffix=" px" onChange={(v) => setSizes((s) => ({ ...s, [tool]: v }))} />
        )}
        {tool !== 'pan' && tool !== 'picker' && <Slider id="tool-opacity" label="Opaklık" value={opacity} min={1} max={100} suffix="%" onChange={setOpacity} />}
        {BRUSH_TOOLS.has(tool) && <Slider id="tool-smooth" label="Sabitleyici" value={smoothing} min={0} max={95} suffix="%" onChange={setSmoothing} />}
        {tool === 'fill' && <Slider id="tool-tol" label="Tolerans" value={tolerance} min={0} max={128} onChange={setTolerance} />}
        {SHAPE_TOOLS.has(tool) && tool !== 'line' && (
          <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-muted-foreground">
            İçini doldur
            <input type="checkbox" checked={shapeFill} onChange={(e) => setShapeFill(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          </label>
        )}
        {tool === 'pan' && <p className="text-xs leading-relaxed text-muted-foreground">Sürükleyerek tuvalde gezin. Her araçta boşluk tuşunu basılı tutarak da kaydırabilirsin.</p>}
        {tool === 'picker' && <p className="text-xs leading-relaxed text-muted-foreground">Tuvalden renk almak için tıkla. Diğer araçlarda Alt tuşuyla da çalışır.</p>}
        {SHAPE_TOOLS.has(tool) && <p className="text-xs leading-relaxed text-muted-foreground">Shift ile kare, daire ya da 45° açılı çizgi.</p>}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5" aria-label="Renk">
        <ColorPicker
          color={color}
          secondary={secondary}
          recent={recent}
          onChange={pickColor}
          onSwap={() => {
            setColor(secondary)
            setSecondary(color)
          }}
        />
      </section>

      <section className="border-t border-border pt-5">
        <LayersPanel
          layers={layers}
          activeId={activeId}
          thumbs={thumbs}
          max={MAX_LAYERS}
          onSelect={commitActive}
          onAdd={() => addLayer()}
          onDuplicate={duplicateLayer}
          onDelete={deleteLayer}
          onMergeDown={mergeDown}
          onMove={moveLayer}
          onClear={clearLayer}
          onImport={() => fileRef.current?.click()}
          onPatch={patchLayer}
        />
      </section>
    </div>
  )

  return (
    <div className="dark flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) importImage(f)
          e.target.value = ''
        }}
      />

      {/* Top bar */}
      <header className="studio-lux-bar relative flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-2 sm:px-3">
        <Link href="/atolye" className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Atölye galerisine dön">
          <ArrowLeft className="size-4" />
          <span className="hidden items-baseline gap-1.5 md:flex">
            <span className="font-semibold tracking-tight text-foreground">SYTHERIS</span>
            <span className="font-serif text-base italic text-[var(--at-gold)]">Atölye</span>
            <span className="rounded-sm border border-[var(--at-gold)]/40 px-1 font-mono text-[9px] font-bold tracking-wider text-[var(--at-gold)]">+</span>
          </span>
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <label htmlFor="doc-title" className="sr-only">
          Eser adı
        </label>
        <input
          id="doc-title"
          value={title}
          maxLength={60}
          onChange={(e) => {
            setTitle(e.target.value)
            markDirty()
          }}
          placeholder="İsimsiz eser"
          className="h-9 w-28 min-w-0 rounded-lg bg-transparent px-2 text-sm font-medium outline-none transition placeholder:text-muted-foreground hover:bg-muted focus:bg-muted sm:w-48"
        />
        <div className="relative">
          <TopButton label="Yeni tuval" onClick={() => setNewOpen((v) => !v)} active={newOpen}>
            <FilePlus2 className="size-4" />
          </TopButton>
          {newOpen && (
            <div className="absolute left-0 top-11 z-50 flex w-56 flex-col gap-1 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
              <p className="px-2 pb-1 pt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Yeni tuval</p>
              {DOC_PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => newDocument(p.w, p.h)} className="flex items-center justify-between rounded-xl px-2.5 py-2 text-sm transition hover:bg-muted">
                  <span className="flex items-center gap-2.5">
                    <span className="grid size-6 place-items-center" aria-hidden="true">
                      <span className="rounded-[3px] border border-foreground/50" style={{ width: (p.w / Math.max(p.w, p.h)) * 20, height: (p.h / Math.max(p.w, p.h)) * 20 }} />
                    </span>
                    {p.label}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {p.w}×{p.h}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <TopButton label="Geri al (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          <Undo2 className="size-4" />
        </TopButton>
        <TopButton label="Yinele (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          <Redo2 className="size-4" />
        </TopButton>
        <span className="mx-0.5 hidden h-6 w-px bg-border md:block" aria-hidden="true" />
        <div className="hidden items-center md:flex">
          <TopButton label="Uzaklaş (-)" onClick={() => zoomBy(0.8)}>
            <Minus className="size-4" />
          </TopButton>
          <button type="button" onClick={fit} className="h-9 w-14 rounded-lg font-mono text-xs tabular-nums text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Sığdır (0)" aria-label={`Yakınlık yüzde ${Math.round(zoom * 100)}, sığdırmak için tıkla`}>
            %{Math.round(zoom * 100)}
          </button>
          <TopButton label="Yakınlaş (+)" onClick={() => zoomBy(1.25)}>
            <Plus className="size-4" />
          </TopButton>
          <TopButton label="Ekrana sığdır (0)" onClick={fit}>
            <Maximize className="size-4" />
          </TopButton>
        </div>
        <TopButton label="Ayna görünüm (F)" onClick={() => setMirror((m) => !m)} active={mirror} className="hidden sm:grid">
          <FlipHorizontal2 className="size-4" />
        </TopButton>
        <TopButton label="Simetrik çizim (Y)" onClick={() => setSymmetry((s) => !s)} active={symmetry} className="hidden sm:grid">
          <SplitSquareHorizontal className="size-4" />
        </TopButton>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground xl:inline" aria-live="polite">
            {saving ? 'Kaydediliyor…' : dirty ? 'Kaydedilmemiş değişiklik' : savedAt ? `Kaydedildi ${new Date(savedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Yeni tuval'}
          </span>
          <TopButton label="Taslağı kaydet (Ctrl+S)" onClick={saveDraft} disabled={saving || !ready}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          </TopButton>
          <TopButton label="PNG olarak indir" onClick={downloadPng} disabled={!ready} className="hidden sm:grid">
            <Download className="size-4" />
          </TopButton>
          <TopButton label="Paneli aç" onClick={() => setPanelOpen(true)} className="lg:hidden">
            <SlidersHorizontal className="size-4" />
          </TopButton>
          <button
            type="button"
            onClick={openPublish}
            disabled={!ready}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 sm:px-4"
          >
            <GalleryVerticalEnd className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sergile</span>
            <span className="sr-only sm:hidden">Galeride sergile</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Tools (desktop) */}
        <aside className="hidden w-16 shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border bg-card py-3 lg:flex" aria-label="Araç çubuğu">
          <ToolRail tool={tool} onTool={setTool} className="flex-col items-center" />
          <div className="mt-auto flex flex-col items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setColor(secondary)
                setSecondary(color)
              }}
              className="relative size-10"
              title="Renkleri değiştir (X)"
              aria-label="Ana ve ikincil rengi değiştir"
            >
              <span className="absolute bottom-0 right-0 size-6 rounded-md border border-border" style={{ background: secondary }} />
              <span className="absolute left-0 top-0 size-7 rounded-md border-2 border-card shadow" style={{ background: color }} />
            </button>
          </div>
        </aside>

        {/* Canvas viewport */}
        <div
          ref={viewportRef}
          className={cn('studio-lux-wall relative min-w-0 flex-1 touch-none select-none overflow-hidden', cursorClass)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={() => {
            if (cursorRef.current) cursorRef.current.style.opacity = '0'
          }}
          onPointerEnter={() => {
            if (cursorRef.current) cursorRef.current.style.opacity = '1'
          }}
          onContextMenu={(e) => e.preventDefault()}
          role="application"
          aria-label={`Çizim tuvali, ${doc.w} × ${doc.h} piksel. Etkin araç: ${toolMeta.label}`}
        >
          <div
            className="absolute left-1/2 top-1/2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]"
            style={{
              width: doc.w,
              height: doc.h,
              marginLeft: -doc.w / 2,
              marginTop: -doc.h / 2,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${mirror ? -zoom : zoom}, ${zoom})`,
              transformOrigin: 'center',
            }}
          >
            <div className="studio-checker absolute inset-0" aria-hidden="true" />
            <canvas ref={displayRef} width={doc.w} height={doc.h} className="relative block size-full" style={{ imageRendering: zoom > 2 ? 'pixelated' : 'auto' }} />
            {symmetry && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-0 border-l border-dashed border-primary/80" style={{ borderLeftWidth: Math.max(1, 1 / zoom) }} />}
          </div>

          {showBrushCursor && (
            <div ref={cursorRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 rounded-full border border-white/90 mix-blend-difference" style={{ width: 10, height: 10, opacity: 0 }}>
              <span className="absolute left-1/2 top-1/2 size-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </div>
          )}

          {!ready && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
              <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Tuval hazırlanıyor
              </p>
            </div>
          )}
        </div>

        {/* Panel (desktop) */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-card p-4 lg:block" aria-label="Fırça, renk ve katmanlar">
          {panel}
        </aside>
      </div>

      {/* Tools (mobile) */}
      <div className="scrollbar-none flex shrink-0 items-center gap-1 overflow-x-auto border-t border-border bg-card px-2 py-2 lg:hidden">
        <ToolRail tool={tool} onTool={setTool} className="flex-row items-center" />
      </div>

      {/* Status bar */}
      <footer className="hidden h-7 shrink-0 items-center gap-4 border-t border-border bg-card px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground lg:flex">
        <span>
          {doc.w} × {doc.h}
        </span>
        <span ref={coordsRef}>—</span>
        <span>%{Math.round(zoom * 100)}</span>
        <span className="text-foreground/70">{toolMeta.label}</span>
        <span className="truncate">{activeLayer?.name}</span>
        <span className="ml-auto">{artist}</span>
        {symmetry && <span className="text-ink">Simetri</span>}
        {mirror && <span className="text-ink">Ayna</span>}
      </footer>

      {/* Panel drawer (mobile) */}
      {panelOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Fırça, renk ve katmanlar">
          <button type="button" className="absolute inset-0 bg-scrim/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} aria-label="Paneli kapat" />
          <div className="absolute inset-y-0 right-0 flex w-[min(92vw,360px)] flex-col overflow-hidden border-l border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Panel</span>
              <button type="button" onClick={() => setPanelOpen(false)} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Kapat">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{panel}</div>
          </div>
        </div>
      )}

      <PublishDialog open={publishOpen} preview={publishPreview} defaultTitle={title} busy={publishing} onClose={() => setPublishOpen(false)} onPublish={publish} />
    </div>
  )
}
