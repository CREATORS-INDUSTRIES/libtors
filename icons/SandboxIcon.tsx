import { useId } from 'react'

// A closed box. Filled, with the details cut out, so it reads in one color on any background.
export default function SandboxIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  const cut = useId()
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" className={className}>
      <mask id={cut}>
        <rect width="24" height="24" fill="#fff" />
        <g fill="none" stroke="#000" strokeWidth="1.4" strokeLinecap="butt" strokeLinejoin="miter">
          {/* Run past the silhouette so each edge splits the faces all the way to the rim. */}
          <path d="M1.8 5.9 12 11.9l10.2-6" />
          <path d="M12 11.9V23.5" />
        </g>
      </mask>
      {/* Each face is clipped to its side of the edges: their edge strokes are wider than the cut
          and would otherwise leave a sliver of one tone along the other. */}
      <clipPath id={`${cut}-lit`}>
        <path d="M-1-1H25V4.2L12 11.9V25H-1Z" />
      </clipPath>
      <clipPath id={`${cut}-shade`}>
        <path d="M12 11.9 25 4.2V25H12Z" />
      </clipPath>
      <g fill="currentColor" stroke="currentColor" strokeLinecap="butt" strokeLinejoin="miter" mask={`url(#${cut})`}>
        <path d="M12 2.3 20.3 7 12 11.9v9.8L3.7 17V7Z" strokeWidth="1.6" clipPath={`url(#${cut}-lit)`} />
        {/* The shaded face is the same color thinned as one layer, so fill and rim never stack into a seam. */}
        <g opacity="0.5" clipPath={`url(#${cut}-shade)`}>
          <path d="M12 11.9 20.3 7v10L12 21.7Z" strokeWidth="1.6" />
        </g>
      </g>
    </svg>
  )
}
