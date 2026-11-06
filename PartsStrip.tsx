import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { createStage, facing, FRONT, layRow, loadModel, wiggle } from './modelStage'

// Narrow enough that the row is seen from as far as the hero's spread, so its pieces look the same.
const FOV = 14
// Wider apart than the hero's spread, and drawn smaller than a tight fit, so each piece reads as a choice of its own.
const GAP = 5
const SHRINK = 1

// The model taken apart into a row of pieces (groups of node names, left to right),
// laid out as the hero's double click spreads them, except that pieces with view
// "top" are laid face up, where a flat board is recognisable and its edge is not. Hover shines the torch and names
// the piece under the pointer; a click wiggles it and selects it, and the selected
// piece is drawn in the accent.
export default function PartsStrip({
  src,
  parts,
  selected,
  onSelect,
  className = '',
}: {
  src: string
  parts: { name: string; nodes: string[]; view?: string }[]
  selected: number
  onSelect: (index: number) => void
  className?: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef(onSelect)
  const selectedRef = useRef(selected)
  const markRef = useRef<(index: number) => void>(() => {})
  const [ready, setReady] = useState(false)
  // The popover keeps its last piece and place while it fades out.
  const [tip, setTip] = useState({ index: 0, x: 0, y: 0 })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    selectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    selectedRef.current = selected
    markRef.current(selected)
  }, [selected])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const stage = createStage(mount, FOV)
    const { pivot } = stage
    // Each piece rolls in screen space on its own holder, around its own centre.
    let holders: THREE.Group[] = []
    const row = { width: 0, height: 0 }
    const wiggleAt = parts.map(() => -Infinity)

    const corner = new THREE.Vector3()
    const bounds = new THREE.Box3()
    const resize = () => {
      if (!stage.resize() || !holders.length) return
      const dist = stage.spanDistance(row.width, row.height) * SHRINK
      stage.place(dist, FRONT)
      for (const holder of holders) holder.rotation.y = facing(holder.position.x, dist)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let disposed = false
    loadModel(src).then(
      (obj) => {
        if (disposed) return
        stage.paint(obj, { lit: false })
        obj.updateMatrixWorld(true)
        const { row: laid, width } = layRow(
          obj,
          parts.map(({ nodes }) => nodes),
          GAP,
        )
        row.width = width
        // A piece laid face up shows its depth where the others show their height.
        row.height = Math.max(...laid.map(({ size }, i) => (parts[i].view === 'top' ? size.z : size.y)))
        holders = laid.map(({ nodes, mid, x }, i) => {
          const holder = new THREE.Group()
          const lay = new THREE.Group()
          if (parts[i].view === 'top') lay.rotation.x = Math.PI / 2
          holder.add(lay)
          // Nodes sit untransformed under the root, so placing each at -mid centres the piece on its holder.
          for (const node of nodes) {
            node.position.copy(mid).negate()
            lay.add(node)
          }
          holder.position.x = x
          pivot.add(holder)
          return holder
        })
        markRef.current(selectedRef.current)
        resize()
        setReady(true)
      },
      (err) => console.error(err),
    )

    // Only the piece under the pointer takes the torch, so its neighbours stay dark; the
    // selected one keeps its accent untouched even under it.
    let marked = -1
    let hot = -1
    const repaint = (i: number) => {
      if (holders[i]) stage.paint(holders[i], { accent: i === marked, lit: i === hot && i !== marked })
    }
    markRef.current = (index) => {
      const was = marked
      marked = index
      repaint(was)
      repaint(index)
    }
    const heat = (index: number) => {
      if (index === hot) return
      const was = hot
      hot = index
      repaint(was)
      repaint(index)
    }

    stage.start((_, now) => {
      holders.forEach((holder, i) => (holder.rotation.z = wiggle((now - wiggleAt[i]) / 1000)))
    })

    // Box test, not triangles: the board alone is too dense to test on every move.
    const under = (e: MouseEvent) => {
      const ray = stage.aim(e).ray
      let best = -1
      let nearest = Infinity
      holders.forEach((holder, i) => {
        if (!ray.intersectBox(bounds.setFromObject(holder), corner)) return
        const d = corner.distanceTo(ray.origin)
        if (d < nearest) {
          nearest = d
          best = i
        }
      })
      return best
    }
    const move = (e: PointerEvent) => {
      const index = under(e)
      heat(index)
      stage.hover(index >= 0)
      mount.style.cursor = index >= 0 ? 'pointer' : ''
      if (index >= 0) setTip({ index, x: e.clientX, y: e.clientY })
      setOpen(index >= 0)
    }
    const leave = () => {
      heat(-1)
      stage.hover(false)
      setOpen(false)
    }
    // The popover is placed in viewport px, which a scroll leaves behind.
    const scroll = () => setOpen(false)
    const click = (e: MouseEvent) => {
      const i = under(e)
      if (i < 0) return
      if (!stage.still) wiggleAt[i] = performance.now()
      selectRef.current(i)
    }
    mount.addEventListener('pointermove', move)
    mount.addEventListener('pointerleave', leave)
    mount.addEventListener('click', click)
    window.addEventListener('scroll', scroll, { passive: true })

    return () => {
      disposed = true
      ro.disconnect()
      mount.removeEventListener('pointermove', move)
      mount.removeEventListener('pointerleave', leave)
      mount.removeEventListener('click', click)
      window.removeEventListener('scroll', scroll)
      stage.dispose()
    }
  }, [src, parts])

  return (
    <>
      <div
        ref={mountRef}
        className={`${className} select-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full`}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}
      />
      {/* Portalled: the strip scrolls sideways on phones, which would clip it. */}
      {ready &&
        createPortal(
          <div
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-50"
            style={{ transform: `translate(${tip.x}px, ${tip.y}px) translate(-50%, calc(-100% - 14px))` }}
          >
            <div
              className="dm-mono origin-bottom whitespace-nowrap rounded-full bg-[#0056ff] px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-white transition-[opacity,transform] duration-[90ms] ease-out"
              style={{ opacity: open ? 1 : 0, transform: `scale(${open ? 1 : 0.8})` }}
            >
              {parts[tip.index].name}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
