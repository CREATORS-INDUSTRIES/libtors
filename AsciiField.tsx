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

// The icon is drawn on its own finer grid inside a pocket the field fades out of, so it
// reads as a figure against the drift instead of a denser patch of it.
const ICON_INK = '#fff'
const ICON_CELL = 5
// Pocket radius past the icon's half size, as a share of it, and the width of its fade.
const POCKET = 1.15
const POCKET_FADE = 0.45
// Icon cells swing between neighbouring glyphs on their own sine, as in AsciiPortrait.
const SWING = 0.08
const SPEED = 1.2

const smoothstep = (a: number, b: number, x: number) => fade(Math.min(Math.max((x - a) / (b - a), 0), 1))
const glyphAt = (v: number) => GLYPHS[Math.round(Math.min(Math.max(v, 0), 1) * (GLYPHS.length - 1))]

// A field of torch glyphs drifting on its own, sized to its parent. Pauses off screen and
// holds a single frame under reduced motion. icon, an image source, is drawn in white at
// iconSize of the field's height, centred at iconY of it: its alpha picks the cells, its brightness their density.
export default function AsciiField({
  seed = 0,
  cell = CELL,
  icon,
  iconSize = 0.6,
  iconY = 0.5,
  className = '',
}: {
  seed?: number
  cell?: number
  icon?: string
  iconSize?: number
  iconY?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let size = { w: 0, h: 0, cols: 0, rows: 0 }
    let pocket = new Float32Array()
    let glyph = { x0: 0, y0: 0, cols: 0, rows: 0, ink: new Float32Array(), phase: new Float32Array() }
    let image: HTMLImageElement | null = null
    let frame = 0
    let last = 0
    let visible = false

    const paint = (t: number) => {
      const { w, h, cols, rows } = size
      ctx.clearRect(0, 0, w, h)
      ctx.font = `${cell}px "DM Mono", monospace`
      ctx.fillStyle = INK
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const g = glyphAt(density(c, r, t, seed) * (pocket[r * cols + c] ?? 1))
          if (g !== ' ') ctx.fillText(g, c * cell * ADVANCE, r * cell)
        }
      }
      const { x0, y0, ink, phase } = glyph
      if (!ink.length) return
      ctx.font = `${ICON_CELL}px "DM Mono", monospace`
      ctx.fillStyle = ICON_INK
      for (let r = 0; r < glyph.rows; r++) {
        for (let c = 0; c < glyph.cols; c++) {
          const i = r * glyph.cols + c
          if (!ink[i]) continue
          const g = glyphAt(ink[i] + SWING * Math.sin(t * SPEED + phase[i]))
          if (g !== ' ') ctx.fillText(g, x0 + c * ICON_CELL * ADVANCE, y0 + r * ICON_CELL)
        }
      }
    }

    const sampleIcon = () => {
      const { w, h, cols, rows } = size
      pocket = new Float32Array()
      glyph = { ...glyph, ink: new Float32Array(), phase: new Float32Array() }
      if (!image?.naturalWidth || !w || !h) return
      const ih = h * iconSize
      const iw = (ih * image.naturalWidth) / image.naturalHeight
      const gcols = Math.floor(iw / (ICON_CELL * ADVANCE))
      const grows = Math.floor(ih / ICON_CELL)
      const sample = document.createElement('canvas')
      sample.width = gcols
      sample.height = grows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(image, 0, 0, gcols, grows)
      const { data } = sctx.getImageData(0, 0, gcols, grows)
      const ink = new Float32Array(gcols * grows)
      for (let i = 0; i < ink.length; i++) {
        const alpha = data[i * 4 + 3] / 255
        if (alpha < 0.2) continue
        // Floored so the faintest shade still draws a glyph and the silhouette never breaks.
        const lum = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
        ink[i] = Math.max(alpha * lum, 0.25)
      }
      glyph = {
        x0: (w - gcols * ICON_CELL * ADVANCE) / 2,
        y0: h * iconY - (grows * ICON_CELL) / 2,
        cols: gcols,
        rows: grows,
        ink,
        phase: Float32Array.from(ink, () => Math.random() * 2 * Math.PI),
      }
      pocket = new Float32Array(cols * rows)
      const rx = (iw / 2) * POCKET
      const ry = (ih / 2) * POCKET
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = ((c + 0.5) * cell * ADVANCE - w / 2) / rx
          const dy = ((r + 0.5) * cell - h * iconY) / ry
          pocket[r * cols + c] = smoothstep(1, 1 + POCKET_FADE, Math.hypot(dx, dy))
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
      ctx.textBaseline = 'top'
      size = { w, h, cols: Math.ceil(w / (cell * ADVANCE)), rows: Math.ceil(h / cell) }
      sampleIcon()
      paint(performance.now() / 1000)
    }

    if (icon) {
      image = new Image()
      image.onload = resize
      image.src = icon
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
      if (image) image.onload = null
    }
  }, [seed, cell, icon, iconSize, iconY])

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} />
}
