import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createStage, loadModel } from './modelStage'

// Seconds per full turn around the model.
const TURN = 18
// Elevation the turn holds, in radians: a little above, so the lid reads along with the sides.
const TILT = 0.3
// Short of the poles, where lookAt loses its up vector.
const POLE = 1.45
// Radians per CSS px of drag.
const DRAG = 0.008
// Seconds a release holds the view before the tilt eases back to TILT, and the rate it then does, per second.
const HOLD = 1.5
const RETURN = 0.8
const ZOOM = { min: 0.5, max: 2, rate: 0.001 }

// The model turned past the camera on its own, level, so every side comes round.
// A drag takes over the turn and the tilt; on release the turn carries on from there and
// the tilt eases back to TILT. The wheel zooms.
export default function OrbitViewer({ src, className = '' }: { src: string; className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const stage = createStage(mount)
    let model: THREE.Object3D | undefined
    // Bounding sphere diameter: the frame must hold the model from any side.
    let size = 0

    stage.resize()
    const ro = new ResizeObserver(() => stage.resize())
    ro.observe(mount)

    let disposed = false
    loadModel(src).then(
      (obj) => {
        if (disposed) return
        stage.paint(obj)
        obj.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(obj)
        obj.position.sub(box.getCenter(new THREE.Vector3()))
        size = 2 * box.getBoundingSphere(new THREE.Sphere()).radius
        stage.pivot.add(obj)
        model = obj
        setReady(true)
        stage.sweep()
      },
      (err) => console.error(err),
    )

    let azimuth = 0
    // Tilt a drag added on top of TILT.
    let lift = 0
    let zoom = 1
    let drag: { x: number; y: number } | null = null
    let releasedAt = -Infinity
    const view = new THREE.Vector3()

    stage.start((dt, now) => {
      if (!model) return
      if (!drag && !stage.still) {
        azimuth += (dt * 2 * Math.PI) / TURN
        if ((now - releasedAt) / 1000 > HOLD) lift *= Math.exp(-dt * RETURN)
      }
      const elevation = THREE.MathUtils.clamp(TILT + lift, -POLE, POLE)
      // Keeps a drag past the pole from building lift the clamp then hides.
      lift = elevation - TILT
      const cos = Math.cos(elevation)
      view.set(Math.sin(azimuth) * cos, Math.sin(elevation), Math.cos(azimuth) * cos)
      stage.place(stage.fitDistance(size) * zoom, view)
    })

    const bounds = new THREE.Box3()
    const onModel = (e: MouseEvent) => !!model && stage.aim(e).ray.intersectsBox(bounds.setFromObject(model))

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY }
      mount.setPointerCapture(e.pointerId)
      mount.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      if (!drag) {
        const over = onModel(e)
        stage.hover(over)
        mount.style.cursor = over ? 'grab' : ''
        return
      }
      stage.aim(e)
      azimuth -= (e.clientX - drag.x) * DRAG
      lift += (e.clientY - drag.y) * DRAG
      drag = { x: e.clientX, y: e.clientY }
    }
    const up = () => {
      if (drag) releasedAt = performance.now()
      drag = null
      mount.style.cursor = ''
    }
    const leave = () => {
      if (!drag) stage.hover(false)
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      zoom = THREE.MathUtils.clamp(zoom * Math.exp(e.deltaY * ZOOM.rate), ZOOM.min, ZOOM.max)
    }
    mount.addEventListener('pointerdown', down)
    mount.addEventListener('pointermove', move)
    mount.addEventListener('pointerup', up)
    mount.addEventListener('pointercancel', up)
    mount.addEventListener('pointerleave', leave)
    mount.addEventListener('wheel', wheel, { passive: false })

    return () => {
      disposed = true
      ro.disconnect()
      mount.removeEventListener('pointerdown', down)
      mount.removeEventListener('pointermove', move)
      mount.removeEventListener('pointerup', up)
      mount.removeEventListener('pointercancel', up)
      mount.removeEventListener('pointerleave', leave)
      mount.removeEventListener('wheel', wheel)
      stage.dispose()
    }
  }, [src])

  return (
    <>
      <link rel="preload" href={src} as="fetch" crossOrigin="anonymous" />
      <div
        ref={mountRef}
        className={`${className} touch-none select-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full`}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}
      />
    </>
  )
}
