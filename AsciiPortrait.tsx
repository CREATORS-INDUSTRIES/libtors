import { useEffect, useRef, type CSSProperties } from 'react'

// The torch's glyphs, sparsest first, so portraits and models read as one hand.
export const GLYPHS = ' .:-=+*#%@'
// CSS px per glyph row; columns are a monospace advance wide.
const CELL = 6
const ADVANCE = 0.6
// Darkest share of the ink a covered cell keeps, so dark clothes still draw on a black page.
const FLOOR = 0.3
// Each cell's ink swings on its own sine, out of phase with its neighbours: how far either
// way, how fast in radians per second, and how often the glyphs are redrawn.
const SWING = 0.07
const SPEED = 1.2
const FPS = 30

// An image redrawn as glyphs on a canvas: coverage comes from its alpha, density from its
// brightness, and every cell drifts between neighbouring glyphs while on screen. Sized by
// CSS height; width follows the source's ratio, like an img with w-auto.
export default function AsciiPortrait({
  src,
  alt,
  className = '',
  style,
  onError,
}: {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  onError?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const errorRef = useRef(onError)

  useEffect(() => {
    errorRef.current = onError
  }, [onError])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const img = new Image()
    let ratio = 0
    let grid = { w: 0, h: 0, cols: 0, rows: 0, ink: new Float32Array(), phase: new Float32Array() }

    const paint = (t: number) => {
      const { w, h, cols, rows, ink, phase } = grid
      ctx.clearRect(0, 0, w, h)
      // Leftover px split around the grid, so it stays centred on the source.
      const x0 = (w - cols * CELL * ADVANCE) / 2
      const y0 = h - rows * CELL
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const value = ink[i]
          if (!value) continue
          const nudged = Math.min(Math.max(value + SWING * Math.sin(t * SPEED + phase[i]), 0), 1)
          const glyph = GLYPHS[Math.round(nudged * (GLYPHS.length - 1))]
          if (glyph !== ' ') ctx.fillText(glyph, x0 + (c + 0.5) * CELL * ADVANCE, y0 + (r + 0.5) * CELL)
        }
      }
    }

    const layout = () => {
      const h = canvas.clientHeight
      if (!ratio || !h) return
      const w = h * ratio
      const dpr = Math.min(window.devicePixelRatio, 2)
      const rows = Math.floor(h / CELL)
      const cols = Math.floor(w / (CELL * ADVANCE))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${CELL}px ui-monospace, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'

      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(img, 0, 0, cols, rows)
      const { data } = sctx.getImageData(0, 0, cols, rows)
      const ink = new Float32Array(cols * rows)
      for (let i = 0; i < ink.length; i++) {
        const alpha = data[i * 4 + 3] / 255
        if (alpha < 0.05) continue
        const lum = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
        ink[i] = alpha * (FLOOR + (1 - FLOOR) * lum)
      }
      const phase = Float32Array.from(ink, () => Math.random() * 2 * Math.PI)
      grid = { w, h, cols, rows, ink, phase }
      paint(still ? 0 : performance.now() / 1000)
    }

    let frame = 0
    let last = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (now - last < 1000 / FPS) return
      last = now
      paint(now / 1000)
    }
    // Shimmers only while on screen.
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame)
      if (entry.isIntersecting && !still) frame = requestAnimationFrame(tick)
    })

    img.onload = () => {
      ratio = img.naturalWidth / img.naturalHeight
      layout()
      io.observe(canvas)
    }
    img.onerror = () => errorRef.current?.()
    img.src = src
    const ro = new ResizeObserver(layout)
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      img.onload = img.onerror = null
    }
  }, [src])

  return <canvas ref={canvasRef} role="img" aria-label={alt} className={className} style={style} />
}
