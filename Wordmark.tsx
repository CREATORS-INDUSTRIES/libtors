import { useEffect, useId, useRef, type ReactNode, type SVGProps } from 'react'
import CreatorsWordmarkPath from './icons/CreatorsWordmarkPath'
import CreatorsHeadPath from './icons/CreatorsHeadPath'

// CreatorsWordmarkPath's user space.
const W = 570
const H = 78
// CreatorsHeadPath's bounds, outside the letters' 0..W x 0..H.
const HEAD = { left: -129.43, top: -23.7, bottom: 96.01 }

const EASE = 0.12
// Light radius as a fraction of the wordmark width.
const SPOT = 0.2

// Intro sweep: a white band crosses the outline once, left to right, and the
// outline appears in its wake.
const WAVE_DURATION = 1000
// Half-width of the band in user units.
const WAVE_BAND = W * 0.18
const BASE_OPACITY = 0.22
// Rest between looped sweeps.
const LOOP_PAUSE = 1500
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const FILL_FADE = 600
const fade = (opacity: number) => ({ opacity, transition: `opacity ${FILL_FADE}ms ease` })

// Outline only, drawn at the frame's hairline weight. The hover light is a radial
// gradient on a second copy of the stroke, so it can only ever light the outline.
// The whole padded root is the hover zone, so the light is already tracking when
// the cursor reaches the letters. fill swaps the outline for solid white letters once
// the first sweep ends, with no hover light.
export default function Wordmark({
  className = '',
  markClassName = 'w-full',
  head = false,
  loop = false,
  fill = false,
  children,
}: {
  className?: string
  markClassName?: string
  head?: boolean
  loop?: boolean
  fill?: boolean
  children?: ReactNode
}) {
  const left = head ? HEAD.left : 0
  const top = head ? HEAD.top : 0
  const width = W - left
  const height = (head ? HEAD.bottom : H) - top
  const zoneRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const lightRef = useRef<SVGRadialGradientElement>(null)
  const waveRef = useRef<SVGLinearGradientElement>(null)
  const revealRef = useRef<SVGLinearGradientElement>(null)
  const outlineRef = useRef<SVGGElement>(null)
  const fillRef = useRef<SVGGElement>(null)
  // useId's colons do not survive inside url(#...).
  const uid = useId().replace(/:/g, '')
  const lightId = `wordmark-light-${uid}`
  const waveId = `wordmark-wave-${uid}`
  const revealId = `wordmark-reveal-${uid}`

  useEffect(() => {
    const wave = waveRef.current
    const reveal = revealRef.current
    const svg = svgRef.current
    if (!wave || !reveal || !svg) return

    // Both gradients ride the same center, so the outline fills in exactly behind the band.
    // Looped sweeps move the band alone: the outline, once drawn, stays.
    let drawn = false
    const place = (center: number) => {
      for (const g of drawn ? [wave] : [wave, reveal]) {
        g.setAttribute('x1', String(center - WAVE_BAND))
        g.setAttribute('x2', String(center + WAVE_BAND))
      }
    }
    const solid = () => {
      if (!fillRef.current || !outlineRef.current) return
      fillRef.current.style.opacity = '1'
      outlineRef.current.style.opacity = '0'
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      place(W + WAVE_BAND)
      solid()
      return
    }
    let frame = 0
    let pause = 0
    let start = 0
    const tick = (time: number) => {
      start ||= time
      const t = Math.min(1, (time - start) / WAVE_DURATION)
      place(left - WAVE_BAND + easeInOut(t) * (width + 2 * WAVE_BAND))
      if (t < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      if (!drawn) solid()
      if (loop)
        pause = window.setTimeout(() => {
          drawn = true
          start = 0
          frame = requestAnimationFrame(tick)
        }, LOOP_PAUSE)
    }
    // Starts when it first scrolls into view: the hero at load, the footer on arrival.
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        seen.disconnect()
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    seen.observe(svg)
    return () => {
      seen.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(pause)
    }
  }, [left, width, loop])

  useEffect(() => {
    const zone = zoneRef.current
    const svg = svgRef.current
    const light = lightRef.current
    if (!zone || !svg || !light) return

    const ease = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : EASE
    const target = { x: 0.5, y: 0.5, r: 0 }
    const now = { x: 0.5, y: 0.5, r: 0 }
    let frame = 0

    const paint = () => {
      light.setAttribute('cx', String(left + now.x * width))
      light.setAttribute('cy', String(top + now.y * height))
      light.setAttribute('r', String(now.r * width))
    }
    const tick = () => {
      now.x += (target.x - now.x) * ease
      now.y += (target.y - now.y) * ease
      now.r += (target.r - now.r) * ease
      paint()
      const settled =
        Math.abs(target.x - now.x) < 1e-3 && Math.abs(target.y - now.y) < 1e-3 && Math.abs(target.r - now.r) < 1e-3
      frame = settled ? 0 : requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    const move = (e: PointerEvent) => {
      const box = svg.getBoundingClientRect()
      target.x = (e.clientX - box.left) / box.width
      target.y = (e.clientY - box.top) / box.height
      target.r = SPOT
      // Light that is out grows from where the cursor enters, not from where it left.
      if (now.r < 0.005) {
        now.x = target.x
        now.y = target.y
      }
      kick()
    }
    const leave = () => {
      target.r = 0
      kick()
    }

    zone.addEventListener('pointermove', move)
    zone.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      zone.removeEventListener('pointermove', move)
      zone.removeEventListener('pointerleave', leave)
    }
  }, [left, top, width, height])

  const paths = (props: SVGProps<SVGPathElement>) => (
    <>
      {head && <CreatorsHeadPath {...props} />}
      <CreatorsWordmarkPath {...props} />
    </>
  )

  return (
    <div ref={zoneRef} className={className}>
      <svg
        ref={svgRef}
        viewBox={`${left} ${top} ${width} ${height}`}
        role="img"
        aria-label="CREATORS"
        className={`block h-auto overflow-visible ${markClassName}`}
      >
        <defs>
          {!fill && (
            <radialGradient ref={lightRef} id={lightId} gradientUnits="userSpaceOnUse" cx={left + width / 2} cy={top + height / 2} r={0}>
              <stop offset="0%" stopColor="#fff" stopOpacity={1} />
              <stop offset="40%" stopColor="#fff" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
          )}
          {/* Parked left of the mark until the sweep runs, so SSR and reduced motion show no band. */}
          <linearGradient
            ref={waveRef}
            id={waveId}
            gradientUnits="userSpaceOnUse"
            x1={left - 3 * WAVE_BAND}
            y1={0}
            x2={left - WAVE_BAND}
            y2={0}
          >
            <stop offset="0%" stopColor="#fff" stopOpacity={0} />
            <stop offset="50%" stopColor="#fff" stopOpacity={1} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          {/* Solid behind the band's center, fading out ahead of it; parked hidden like the wave. */}
          <linearGradient
            ref={revealRef}
            id={revealId}
            gradientUnits="userSpaceOnUse"
            x1={left - 3 * WAVE_BAND}
            y1={0}
            x2={left - WAVE_BAND}
            y2={0}
          >
            <stop offset="50%" stopColor="#fff" stopOpacity={BASE_OPACITY} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g ref={outlineRef} style={fill ? fade(1) : undefined}>
          {[
            { stroke: `url(#${revealId})`, strokeWidth: 1 },
            { stroke: `url(#${waveId})`, strokeWidth: 1.5 },
            ...(fill ? [] : [{ stroke: `url(#${lightId})`, strokeWidth: 1.5 }]),
          ].map((layer) => (
            <g key={layer.stroke}>{paths({ ...layer, fill: 'none', vectorEffect: 'non-scaling-stroke' })}</g>
          ))}
        </g>
        {fill && (
          <g ref={fillRef} style={fade(0)}>
            {paths({ fill: '#fff' })}
          </g>
        )}
      </svg>
      {children}
    </div>
  )
}
