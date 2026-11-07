import type { CSSProperties, ReactNode } from 'react'
import './motion.css'

const EDGE_FADE = 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'

// An endless row: children are laid out twice and the track slides by one copy, so the loop has no seam.
// Children need fixed widths, and one copy must be wider than the row, or the loop shows its end.
export default function Marquee({
  children,
  duration = '30s',
  className = '',
}: {
  children: ReactNode
  duration?: string
  className?: string
}) {
  return (
    <div
      className={`libtors-marquee-host ${className}`}
      style={{ WebkitMaskImage: EDGE_FADE, maskImage: EDGE_FADE }}
    >
      <div
        className="libtors-marquee flex w-max"
        style={{ '--libtors-marquee-duration': duration } as CSSProperties}
      >
        <div className="flex">{children}</div>
        <div aria-hidden className="flex">
          {children}
        </div>
      </div>
    </div>
  )
}
