import { useId } from 'react'

// A screwdriver crossed over a wrench. The wrench sits behind in the shaded tone, the same depth cue
// as the cube's dark face, and a gap around the shaft keeps the two tools from merging.
export default function ControlIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  const cut = useId()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" className={className}>
      <mask id={cut}>
        <rect width="24" height="24" fill="#fff" />
        <path d="M16.9 7.1 21.6 2.4" stroke="#000" strokeWidth="3" />
        <path d="M9.6 9.6 17.6 17.6" stroke="#000" strokeWidth="3.6" strokeLinecap="butt" />
      </mask>
      {/* One layer for the opacity, so the handle's stroke and the head never stack into a seam. */}
      <g mask={`url(#${cut})`} opacity="0.5" fill="currentColor" stroke="currentColor">
        <circle cx="17" cy="7" r="4.6" stroke="none" />
        <path d="M4.6 19.4 15 9" strokeWidth="3.4" strokeLinecap="butt" fill="none" />
      </g>
      <g fill="currentColor" stroke="currentColor" strokeLinecap="butt">
        <path d="M4.4 4.4 8.4 8.4" strokeWidth="4.4" fill="none" />
        <path d="M9.6 9.6 16.8 16.8" strokeWidth="1.8" fill="none" />
        {/* A flathead blade: flared where it leaves the shaft, tapering to a square edge, where a point would read as a pencil. */}
        <path d="M17.52 15.68 19.99 19.21 19.21 19.99 15.68 17.52Z" strokeWidth="0.6" strokeLinejoin="miter" />
      </g>
    </svg>
  )
}
