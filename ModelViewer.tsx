import { useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { createStage, facing, FRONT, layRow, loadModel, VIEW, wiggle } from './modelStage'

// Half the lid slot (-3.06..6.74) less half the lever width, centred on where the knob is modelled.
const TRAVEL = 4.5
// Seconds for one end-to-end-and-back sweep.
const SWEEP = 4
// The idle sweep stops short of the slot ends; only a drag reaches them.
const REACH = TRAVEL * 0.7
const GRIPS = ['knob-faces', 'lever-faces']
// Rate the spread closes on its target, per second.
const EASE = 8
const NONE: string[][] = []
const UP = new THREE.Vector3(0, 1, 0)

// The assembled model held still and framed to its bounds; the knob sweeps the slot
// until grabbed, then follows the drag. Hover shines the torch, a click wiggles the
// model, and a double click lays the pieces out in a row facing the camera, and back.
// Everything WebGL happens after mount, so the prerender ships an empty box plus a
// preload that starts the fetch early.
// spreadRef: hands the spread to the caller, read every frame so scroll can drive it
// without a render; the double click then no longer toggles it.
export default function ModelViewer({
  src,
  pieces = NONE,
  spreadRef,
  className = '',
}: {
  src: string
  pieces?: string[][]
  spreadRef?: RefObject<number>
  className?: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const stage = createStage(mount)
    const { camera, tilt, pivot } = stage

    let model: THREE.Object3D | undefined
    let slider: THREE.Object3D | undefined
    const grips: THREE.Object3D[] = []
    // Every node a piece names, with where it sits in the row relative to its assembled place.
    let parts: { node: THREE.Object3D; offset: THREE.Vector3; mid: THREE.Vector3; x: number }[] = []
    const span = { width: 0, height: 0 }
    let maxSize = 0

    stage.resize()
    const ro = new ResizeObserver(() => stage.resize())
    ro.observe(mount)

    let disposed = false
    loadModel(src).then(
      (obj) => {
        if (disposed) return
        stage.paint(obj)
        obj.traverse((node) => {
          if (GRIPS.includes(node.name)) grips.push(node)
        })
        slider = obj.getObjectByName('slider')
        obj.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(obj)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const { row, width, height } = layRow(obj, pieces)
        span.width = width
        span.height = height
        parts = row.flatMap(({ nodes, mid, x }) => {
          const offset = new THREE.Vector3(x, 0, 0).add(center).sub(mid)
          return nodes.map((node) => ({ node, offset, mid, x }))
        })
        obj.position.sub(center)
        pivot.add(obj)
        model = obj
        maxSize = Math.max(size.x, size.y, size.z)
        setReady(true)
      },
      (err) => console.error(err),
    )

    // The pointer ray meets a plane through the grab point that contains the slot
    // axis, so the knob tracks the cursor. touch-pan-y leaves vertical swipes to the
    // page, so a phone can still scroll past.
    const plane = new THREE.Plane()
    const hit = new THREE.Vector3()
    const bounds = new THREE.Box3()
    let grab: { point: THREE.Vector3; axis: THREE.Vector3; from: number } | null = null
    let dragged = false
    // Sine of phase is the knob position; resuming from asin keeps the sweep continuous after a drag.
    let phase = 0
    let wiggleAt = -Infinity
    let open = false
    let spread = 0
    const target = () => (spreadRef ? THREE.MathUtils.clamp(spreadRef.current, 0, 1) : open ? 1 : 0)
    const view = new THREE.Vector3()

    stage.start((dt, now) => {
      if (!model) return
      // Scroll is already continuous; easing it again would only trail the page.
      spread = spreadRef ? target() : spread + (target() - spread) * (stage.still ? 1 : 1 - Math.exp(-dt * EASE))
      if (slider && !grab && !stage.still) {
        phase += (dt * 2 * Math.PI) / SWEEP
        slider.position.x = REACH * Math.sin(phase) * (1 - spread)
      }
      const far = stage.spanDistance(span.width, span.height)
      // Each piece turns about its own centre, so the turn leaves it where the row puts it.
      for (const { node, offset, mid, x } of parts) {
        node.quaternion.setFromAxisAngle(UP, facing(x, far) * spread)
        node.position.copy(mid).applyQuaternion(node.quaternion).negate().add(mid).addScaledVector(offset, spread)
      }
      tilt.rotation.z = wiggle((now - wiggleAt) / 1000)
      const dist = THREE.MathUtils.lerp(stage.fitDistance(maxSize), far, spread)
      stage.place(dist, view.lerpVectors(VIEW, FRONT, spread).normalize())
    })

    const onKnob = (ray: THREE.Raycaster) => target() < 0.01 && ray.intersectObjects(grips, false)[0]
    // Piece boxes, not triangles: the board alone is too dense to test on every move.
    const onModel = (ray: THREE.Raycaster) =>
      parts.length
        ? parts.some(({ node }) => ray.ray.intersectsBox(bounds.setFromObject(node)))
        : !!model && ray.ray.intersectsBox(bounds.setFromObject(model))
    const down = (e: PointerEvent) => {
      if (!slider) return
      const target = onKnob(stage.aim(e))
      if (!target) return
      const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(pivot.quaternion)
      const facing = camera.getWorldDirection(new THREE.Vector3())
      facing.addScaledVector(axis, -facing.dot(axis)).normalize()
      plane.setFromNormalAndCoplanarPoint(facing, target.point)
      grab = { point: target.point, axis, from: slider.position.x }
      mount.setPointerCapture(e.pointerId)
      mount.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      const ray = stage.aim(e)
      if (!grab) {
        const over = onModel(ray)
        stage.hover(over)
        mount.style.cursor = onKnob(ray) ? 'grab' : over ? 'pointer' : ''
        return
      }
      if (!slider || !ray.ray.intersectPlane(plane, hit)) return
      const along = hit.sub(grab.point).dot(grab.axis)
      slider.position.x = THREE.MathUtils.clamp(grab.from + along, -TRAVEL, TRAVEL)
      dragged = true
    }
    const up = () => {
      if (grab && slider) phase = Math.asin(THREE.MathUtils.clamp(slider.position.x / REACH, -1, 1))
      grab = null
      mount.style.cursor = ''
    }
    const leave = () => {
      if (!grab) stage.hover(false)
    }
    const click = (e: MouseEvent) => {
      if (dragged) {
        dragged = false
        return
      }
      if (!onModel(stage.aim(e))) return
      // The first click of a double click wiggles too; the spread starts over it.
      if (e.detail === 2 && !spreadRef) open = !open
      else if (e.detail === 1 && !stage.still) wiggleAt = performance.now()
    }
    mount.addEventListener('pointerdown', down)
    mount.addEventListener('pointermove', move)
    mount.addEventListener('pointerup', up)
    mount.addEventListener('pointercancel', up)
    mount.addEventListener('pointerleave', leave)
    mount.addEventListener('click', click)

    return () => {
      disposed = true
      ro.disconnect()
      mount.removeEventListener('pointerdown', down)
      mount.removeEventListener('pointermove', move)
      mount.removeEventListener('pointerup', up)
      mount.removeEventListener('pointercancel', up)
      mount.removeEventListener('pointerleave', leave)
      mount.removeEventListener('click', click)
      stage.dispose()
    }
  }, [src, pieces, spreadRef])

  return (
    <>
      <link rel="preload" href={src} as="fetch" crossOrigin="anonymous" />
      <div
        ref={mountRef}
        className={`${className} touch-pan-y select-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full`}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}
      />
    </>
  )
}
