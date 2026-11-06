import { useEffect, useRef } from 'react'
import { GLYPHS } from './AsciiPortrait'

// CSS px per glyph row; columns are a monospace advance wide.
const CELL = 10
const ADVANCE = 0.6
const FPS = 24
// Raised density keeps most of the field blank, so it reads as texture behind content, not as content.
const SPARSITY = 2.2
const INK = 'rgba(255, 255, 255, 0.32)'

// Lattice noise: a hashed value per integer point, smoothly blended between them. No sines, so no period to spot.
function hash(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const fade = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const u = fade(x - xi)
  const v = fade(y - yi)
  const w = fade(z - zi)
  const plane = (k: number) =>
    lerp(
      lerp(hash(xi, yi, k), hash(xi + 1, yi, k), u),
      lerp(hash(xi, yi + 1, k), hash(xi + 1, yi + 1, k), u),
      v,
    )
  return lerp(plane(zi), plane(zi + 1), w)
}

// Three octaves, each finer and fainter, normalised back to 0..1.
function fbm(x: number, y: number, z: number) {
  return (noise(x, y, z) + 0.5 * noise(x * 2, y * 2, z * 2) + 0.25 * noise(x * 4, y * 4, z * 4)) / 1.75
}

// The field is sampled through a second, slower noise that bends its coordinates, so blobs
// stretch, split and merge instead of sliding by.
function density(c: number, r: number, t: number, seed: number) {
  const x = c * 0.09
  const y = r * 0.09
  const z = t * 0.12 + seed
  const bendX = fbm(x * 0.7, y * 0.7, z * 0.6)
  const bendY = fbm(x * 0.7 + 5.2, y * 0.7 + 1.3, z * 0.6)
  const v = fbm(x + 2.5 * bendX, y + 2.5 * bendY, z)
  // fbm clusters around the middle: stretch its working band to the full ramp.
  const stretched = Math.min(Math.max((v - 0.32) / 0.38, 0), 1)
  return Math.pow(stretched, SPARSITY)
}

// A field of torch glyphs drifting on its own, sized to its parent. Pauses off screen and
// holds a single frame under reduced motion.
export default function AsciiField({ seed = 0, className = '' }: { seed?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let size = { w: 0, h: 0, cols: 0, rows: 0 }
    let frame = 0
    let last = 0
    let visible = false

    const paint = (t: number) => {
      const { w, h, cols, rows } = size
      ctx.clearRect(0, 0, w, h)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const glyph = GLYPHS[Math.round(density(c, r, t, seed) * (GLYPHS.length - 1))]
          if (glyph !== ' ') ctx.fillText(glyph, c * CELL * ADVANCE, r * CELL)
        }
      }
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${CELL}px "DM Mono", monospace`
      ctx.textBaseline = 'top'
      ctx.fillStyle = INK
      size = { w, h, cols: Math.ceil(w / (CELL * ADVANCE)), rows: Math.ceil(h / CELL) }
      paint(performance.now() / 1000)
    }

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      if (now - last < 1000 / FPS) return
      last = now
      paint(now / 1000)
    }

    const sizer = new ResizeObserver(resize)
    sizer.observe(parent)
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      cancelAnimationFrame(frame)
      if (visible && !still) frame = requestAnimationFrame(loop)
    })
    watcher.observe(canvas)

    return () => {
      cancelAnimationFrame(frame)
      sizer.disconnect()
      watcher.disconnect()
    }
  }, [seed])

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} />
}
