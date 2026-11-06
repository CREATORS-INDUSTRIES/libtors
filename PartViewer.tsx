import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createStage, loadModel } from './modelStage'

// Seconds per turntable revolution.
const TURN = 24
// Radians of turn per px of horizontal drag.
const DRAG = 0.01
// Seconds a newly shown piece takes to grow in.
const ENTER = 0.5

// One piece (a group of node names) alone, framed to its own bounds, turning slowly;
// a horizontal drag turns it by hand. Swapping the piece keeps the canvas, grows the
// new one in and sweeps glyphs across it. Hover shines the torch. scale draws the piece
// that share of its framed size, for a compact one that would otherwise look larger than its neighbours.
export default function PartViewer({ src, nodes, scale = 1, className = '' }: { src: string; nodes: string[]; scale?: number; className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const showRef = useRef<(names: string[], scale: number) => void>(() => {})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const stage = createStage(mount)
    const { pivot } = stage
    let model: THREE.Object3D | undefined
    let shown: THREE.Object3D | undefined
    let wanted: string[] = []
    let wantedScale = 1
    let maxSize = 0
    let shownAt = -Infinity

    const resize = () => {
      if (stage.resize() && maxSize) stage.place(stage.fitDistance(maxSize))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // Clones, so the loaded model keeps every piece for the next swap.
    const show = (names: string[], scale: number) => {
      wanted = names
      wantedScale = scale
      if (!model) return
      if (shown) pivot.remove(shown)
      const piece = new THREE.Group()
      for (const name of names) {
        const node = model.getObjectByName(name)
        if (node) piece.add(node.clone())
      }
      const box = new THREE.Box3().setFromObject(piece)
      const size = box.getSize(new THREE.Vector3())
      piece.position.sub(box.getCenter(new THREE.Vector3()))
      shown = new THREE.Group().add(piece)
      pivot.add(shown)
      maxSize = Math.max(size.x, size.y, size.z) / scale
      shownAt = performance.now()
      stage.sweep()
      resize()
    }
    showRef.current = show

    let disposed = false
    loadModel(src).then(
      (obj) => {
        if (disposed) return
        stage.paint(obj)
        obj.updateMatrixWorld(true)
        model = obj
        show(wanted, wantedScale)
        setReady(true)
      },
      (err) => console.error(err),
    )

    let drag: { x: number; from: number } | null = null
    stage.start((dt, now) => {
      if (!drag && !stage.still) pivot.rotation.y += (dt * 2 * Math.PI) / TURN
      if (shown) {
        const t = stage.still ? 1 : Math.min((now - shownAt) / 1000 / ENTER, 1)
        shown.scale.setScalar(0.85 + 0.15 * (1 - (1 - t) ** 3))
      }
    })

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, from: pivot.rotation.y }
      mount.setPointerCapture(e.pointerId)
      mount.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      stage.aim(e)
      stage.hover(true)
      if (drag) pivot.rotation.y = drag.from + (e.clientX - drag.x) * DRAG
    }
    const up = () => {
      drag = null
      mount.style.cursor = ''
    }
    const leave = () => {
      if (!drag) stage.hover(false)
    }
    mount.addEventListener('pointerdown', down)
    mount.addEventListener('pointermove', move)
    mount.addEventListener('pointerup', up)
    mount.addEventListener('pointercancel', up)
    mount.addEventListener('pointerleave', leave)

    return () => {
      disposed = true
      ro.disconnect()
      mount.removeEventListener('pointerdown', down)
      mount.removeEventListener('pointermove', move)
      mount.removeEventListener('pointerup', up)
      mount.removeEventListener('pointercancel', up)
      mount.removeEventListener('pointerleave', leave)
      stage.dispose()
    }
  }, [src])

  useEffect(() => {
    showRef.current(nodes, scale)
  }, [nodes, scale])

  return (
    <div
      ref={mountRef}
      className={`${className} cursor-grab touch-pan-y select-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full`}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}
    />
  )
}
