import { useId } from 'react'

// A twelve-point seal.
const SEAL =
  'M12.00 2.60 13.60 3.81 15.60 3.56 16.38 5.42 18.24 6.20 17.99 8.20 19.20 9.80 17.99 11.40 18.24 13.40 16.38 14.18 15.60 16.04 13.60 15.79 12.00 17.00 10.40 15.79 8.40 16.04 7.62 14.18 5.76 13.40 6.01 11.40 4.80 9.80 6.01 8.20 5.76 6.20 7.62 5.42 8.40 3.56 10.40 3.81Z'

// A verified rosette: the seal in full color with a check cut out, its two ribbons behind it in
// the shaded tone, the same depth cue as the cube's dark face.
export default function TrustIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  const cut = useId()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" className={className}>
      {/* The ribbons lose the seal's footprint, widened, so a gap separates them like every other overlap. */}
      <mask id={`${cut}-behind`}>
        <rect width="24" height="24" fill="#fff" />
        <path d={SEAL} fill="#000" stroke="#000" strokeWidth="2.6" strokeLinejoin="miter" />
      </mask>
      <mask id={cut}>
        <rect width="24" height="24" fill="#fff" />
        <path d="M8.8 10 11 12.2l4.2-4.6" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="miter" />
      </mask>
      <g mask={`url(#${cut}-behind)`} opacity="0.5" fill="currentColor">
        <path d="M7.4 13 5.2 22.4l2.6-1.4 1.8 2.2 2-8.6Z" />
        <path d="M16.6 13l2.2 9.4-2.6-1.4-1.8 2.2-2-8.6Z" />
      </g>
      <path d={SEAL} fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="miter" mask={`url(#${cut})`} />
    </svg>
  )
}
