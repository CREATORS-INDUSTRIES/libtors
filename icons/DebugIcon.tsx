import { useId } from 'react'

// Drawn upright, then turned and squashed so the bug reads in perspective, like the cube.
const TILT = 'translate(12 12.6) rotate(-30) scale(1 0.88) translate(-13 -14)'

// A ladybug from above: the shell in full color, its parted wings and spots cut out, with head,
// antennae and legs behind it in the shaded tone.
export default function DebugIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  const cut = useId()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" className={className}>
      <mask id={cut}>
        <rect width="24" height="24" fill="#fff" />
        <g transform={TILT} fill="#000">
          {/* The seam widens toward the tail, so the wings read as parting, not as a drawn line. */}
          <path d="M12.4 6.4h1.2L14.3 22.6h-2.6Z" />
          <circle cx="9.7" cy="11.4" r="1.5" />
          <circle cx="16.3" cy="11.4" r="1.5" />
          <circle cx="9.4" cy="16.6" r="1.35" />
          <circle cx="16.6" cy="16.6" r="1.35" />
        </g>
      </mask>
      {/* Everything behind the shell is cut where the shell sits, and a little past it: the parted wings show the
          background, not the head, and a gap rims the shell like the cuts on the other icons. */}
      <mask id={`${cut}-behind`}>
        <rect width="24" height="24" fill="#fff" />
        <ellipse transform={TILT} cx="13" cy="14.6" rx="7.4" ry="8" fill="#000" />
      </mask>
      {/* One layer for the opacity, so the head and the legs under it never stack into darker seams. */}
      <g mask={`url(#${cut}-behind)`}>
        <g transform={TILT} opacity="0.5" fill="currentColor" stroke="currentColor" strokeLinecap="butt">
          <circle cx="13" cy="7" r="3.4" stroke="none" />
          <g fill="none" strokeWidth="1.3">
            <path d="M11.8 4.2 10.4 2.2" />
            <path d="M14.2 4.2l1.4-2" />
          </g>
          <g fill="none" strokeWidth="1.7">
            <path d="M6.6 11.6 3.8 10.2" />
            <path d="M6.1 14.8H3.2" />
            <path d="M6.8 18l-2.6 2" />
            <path d="M19.4 11.6l2.8-1.4" />
            <path d="M19.9 14.8h2.9" />
            <path d="M19.2 18l2.6 2" />
          </g>
        </g>
      </g>
      <g mask={`url(#${cut})`}>
        <ellipse transform={TILT} cx="13" cy="14.6" rx="6.8" ry="7.4" fill="currentColor" />
      </g>
    </svg>
  )
}
