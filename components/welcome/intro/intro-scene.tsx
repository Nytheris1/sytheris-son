'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Image, Sparkles } from '@react-three/drei'
import type { MotionValue } from 'motion/react'
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MathUtils, Vector3, type Color, type Group, type Mesh } from 'three'
import { cssVarColor, textureUrl } from '@/components/three/css-color'
import { QuietBoundary } from '@/components/three/quiet-boundary'

type ImageMesh = Mesh & { material: { grayscale: number; zoom: number; opacity: number } }

const STEP_ANGLE = (Math.PI * 2) / 7
const STEP_Y = 0.62
const CARD_W = 1.35
const CARD_H = CARD_W * 1.5

const lookTarget = new Vector3()
const worldPos = new Vector3()

function Cover({ url, index, radius, hoverable }: { url: string; index: number; radius: number; hoverable: boolean }) {
  const ref = useRef<ImageMesh>(null)
  const [hovered, setHovered] = useState(false)
  const angle = index * STEP_ANGLE
  const y = -index * STEP_Y

  useFrame((state, dt) => {
    const mesh = ref.current
    if (!mesh) return
    mesh.getWorldPosition(worldPos)
    const dist = worldPos.distanceTo(state.camera.position)
    const color = hovered ? 1 : 1 - MathUtils.smoothstep(dist, radius * 2.4, radius * 4.2)
    mesh.material.grayscale = MathUtils.damp(mesh.material.grayscale, 1 - color, 6, dt)
    mesh.material.zoom = MathUtils.damp(mesh.material.zoom, hovered ? 1.12 : 1, 8, dt)
    const s = MathUtils.damp(mesh.scale.x, hovered ? CARD_W * 1.1 : CARD_W, 8, dt)
    mesh.scale.set(s, s * 1.5, 1)
  })

  return (
    <Image
      ref={ref as never}
      url={textureUrl(url)}
      transparent
      radius={0.08}
      grayscale={1}
      scale={[CARD_W, CARD_H]}
      position={[Math.sin(angle) * radius, y, Math.cos(angle) * radius]}
      rotation={[0, angle, 0]}
      side={2}
      onPointerOver={hoverable ? (e) => (e.stopPropagation(), setHovered(true)) : undefined}
      onPointerOut={hoverable ? () => setHovered(false) : undefined}
    />
  )
}

function Tower({ covers, progress, radius, reduced, shift }: { covers: string[]; progress: MotionValue<number>; radius: number; reduced: boolean; shift: boolean }) {
  const group = useRef<Group>(null)
  const height = (covers.length - 1) * STEP_Y

  useFrame((state, dt) => {
    const p = progress.get()
    const g = group.current
    if (!g) return
    const idle = reduced ? 0 : state.clock.elapsedTime * 0.06
    g.rotation.y = MathUtils.damp(g.rotation.y, p * Math.PI * 2.4 + idle, 4, dt)
    const side = shift ? radius * 0.8 : 0
    const shiftX = p < 0.42 ? MathUtils.lerp(side, -side, MathUtils.smoothstep(p, 0.2, 0.36)) : MathUtils.lerp(-side, 0, MathUtils.smoothstep(p, 0.55, 0.68))
    g.position.x = MathUtils.damp(g.position.x, shiftX, 4, dt)

    const cam = state.camera
    const dive = MathUtils.smoothstep(p, 0.72, 1)
    const targetY = MathUtils.lerp(1.2, -height * 0.78, MathUtils.smoothstep(p, 0, 0.85))
    const targetZ = MathUtils.lerp(radius * 3.7, radius * 1.65, MathUtils.smoothstep(p, 0, 0.7)) * (1 - dive) + 0.2 * dive
    const px = reduced ? 0 : state.pointer.x * 0.6
    const py = reduced ? 0 : state.pointer.y * 0.35
    cam.position.x = MathUtils.damp(cam.position.x, px, 3, dt)
    cam.position.y = MathUtils.damp(cam.position.y, targetY + py, 4, dt)
    cam.position.z = MathUtils.damp(cam.position.z, targetZ, 4, dt)
    lookTarget.set(0, cam.position.y - MathUtils.lerp(2.4, 0.4, dive), 0)
    cam.lookAt(lookTarget)
  })

  return (
    <group ref={group}>
      {covers.map((url, i) => (
        <QuietBoundary key={url + i}>
          <Suspense fallback={null}>
            <Cover url={url} index={i} radius={radius} hoverable={!reduced} />
          </Suspense>
        </QuietBoundary>
      ))}
    </group>
  )
}

function Atmosphere({ onReady }: { onReady: (c: { bg: Color; accent: Color }) => void }) {
  const { scene } = useThree()
  useLayoutEffect(() => {
    const host = document.querySelector('[data-intro-stage]') ?? document.documentElement
    const bg = cssVarColor('--scrim', '#0b0b0d', host)
    const accent = cssVarColor('--primary', '#4ade80', host)
    scene.background = bg
    onReady({ bg, accent })
  }, [scene, onReady])
  return null
}

export default function IntroScene({
  covers,
  progress,
  active,
  reduced,
  compact,
}: {
  covers: string[]
  progress: MotionValue<number>
  active: boolean
  reduced: boolean
  compact: boolean
}) {
  const [colors, setColors] = useState<{ bg: Color; accent: Color } | null>(null)
  const list = useMemo(() => covers.slice(0, compact ? 18 : 28), [covers, compact])
  const radius = compact ? 2.4 : 3.4

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: compact ? 55 : 42, near: 0.1, far: 60, position: [0, 1.2, radius * 3.7] }}
      aria-hidden="true"
    >
      <Atmosphere onReady={setColors} />
      {colors && <fog attach="fog" args={[colors.bg, radius * 1.4, radius * 5.5]} />}
      <Tower covers={list} progress={progress} radius={radius} reduced={reduced} shift={!compact} />
      {colors && !reduced && (
        <Sparkles count={compact ? 60 : 140} scale={[radius * 4, (list.length * STEP_Y) + 8, radius * 4]} position={[0, -(list.length * STEP_Y) / 2, 0]} size={2.2} speed={0.25} opacity={0.6} color={colors.accent} />
      )}
    </Canvas>
  )
}
