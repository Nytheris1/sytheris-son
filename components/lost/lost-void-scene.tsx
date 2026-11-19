'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Image } from '@react-three/drei'
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MathUtils, type Color, type Group } from 'three'
import { cssVarColor, textureUrl } from '@/components/three/css-color'
import { QuietBoundary } from '@/components/three/quiet-boundary'

function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function Drift({ covers, reduced }: { covers: string[]; reduced: boolean }) {
  const group = useRef<Group>(null)
  const cards = useMemo(
    () =>
      covers.map((url, i) => {
        const a = seeded(i) * Math.PI * 2
        const r = 2.6 + seeded(i + 40) * 4.5
        return {
          url,
          position: [Math.cos(a) * r * 1.4, (seeded(i + 80) - 0.5) * 6, -seeded(i + 120) * 9 - 1] as [number, number, number],
          rotation: [(seeded(i + 160) - 0.5) * 1.2, (seeded(i + 200) - 0.5) * 1.6, (seeded(i + 240) - 0.5) * 1.2] as [number, number, number],
          speed: 0.6 + seeded(i + 280) * 1.2,
        }
      }),
    [covers],
  )

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    if (!reduced) g.rotation.z += dt * 0.012
    state.camera.position.x = MathUtils.damp(state.camera.position.x, reduced ? 0 : state.pointer.x * 0.8, 2.5, dt)
    state.camera.position.y = MathUtils.damp(state.camera.position.y, reduced ? 0 : state.pointer.y * 0.5, 2.5, dt)
    state.camera.lookAt(0, 0, -4)
  })

  return (
    <group ref={group}>
      {cards.map((c, i) => (
        <QuietBoundary key={c.url + i}>
          <Suspense fallback={null}>
            <Float speed={reduced ? 0 : c.speed} rotationIntensity={reduced ? 0 : 0.8} floatIntensity={reduced ? 0 : 1.2}>
              <Image url={textureUrl(c.url)} transparent radius={0.06} grayscale={0.85} scale={[1.2, 1.8]} position={c.position} rotation={c.rotation} side={2} />
            </Float>
          </Suspense>
        </QuietBoundary>
      ))}
    </group>
  )
}

function Background({ onColor }: { onColor: (c: Color) => void }) {
  useLayoutEffect(() => {
    const host = document.querySelector('[data-lost-stage]') ?? document.documentElement
    onColor(cssVarColor('--scrim', '#0b0b0d', host))
  }, [onColor])
  return null
}

export default function LostVoidScene({ covers, reduced }: { covers: string[]; reduced: boolean }) {
  const [bg, setBg] = useState<Color | null>(null)
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 50, position: [0, 0, 6] }} gl={{ antialias: true, alpha: false }} aria-hidden="true">
      <Background onColor={setBg} />
      {bg && <color attach="background" args={[bg]} />}
      {bg && <fog attach="fog" args={[bg, 5, 16]} />}
      <Drift covers={covers.slice(0, 18)} reduced={reduced} />
    </Canvas>
  )
}
