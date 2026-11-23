import { useEffect, useState } from 'react'

const R = 9
const MERIDIANS = 6
// Seconds per full turn.
const TURN = 8
const TILT = -15
// The grid sits under the outline, finer, so the rim reads as the globe and the lines as its surface.
const GRID = 1.1

// GlobeIcon's outline and equator, with its meridians turning about the vertical axis. Each meridian is the front half
// of a great circle, which head on is a half-ellipse whose width follows the sine of its longitude. Each is drawn at
// full strength and dropped once it turns behind, where it has already merged with the outline.
export default function GlobeSpinIcon({
  spin = true,
  width = 16,
  height = 16,
  className = '',
}: {
  /** Off holds a still frame, for reduced motion. */
  spin?: boolean
  width?: number
  height?: number
  className?: string
}) {
  const [turn, setTurn] = useState(0.08)

  useEffect(() => {
    if (!spin) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      setTurn(0.08 + ((now - start) / 1000 / TURN) % 1)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [spin])

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r={R} stroke="currentColor" strokeWidth="1.45" />
      {/* A lean on the axis, short of Earth's 23.5°: the grid tilts, the turn stays about the tilted axis. */}
      <g transform={`rotate(${TILT} 12 12)`}>
        <path d="M3 12h18" stroke="currentColor" strokeWidth={GRID} strokeLinecap="round" />
        {Array.from({ length: MERIDIANS }).map((_, k) => {
          const longitude = (turn + k / MERIDIANS) * 2 * Math.PI
          const facing = Math.cos(longitude)
          if (facing <= 0) return null
          const bulge = Math.sin(longitude)
          return (
            <path
              key={k}
              d={`M12 ${12 - R}A${Math.abs(bulge) * R} ${R} 0 0 ${bulge > 0 ? 1 : 0} 12 ${12 + R}`}
              stroke="currentColor"
              strokeWidth={GRID}
            />
          )
        })}
      </g>
    </svg>
  )
}
