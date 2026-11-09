// nudge: hops up-right while its `group` is hovered. The transform sits on an inner <g>, not the
// <svg>: it moves in subpixels like any transform, yet never lifts the icon onto its own layer.
export default function ExternalLinkIcon({
  width = 16,
  height = 16,
  className = '',
  nudge = false,
}: {
  width?: number
  height?: number
  className?: string
  nudge?: boolean
}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <g
        className={
          nudge
            ? 'transition-transform duration-200 ease-out group-hover:-translate-y-[3px] group-hover:translate-x-[3px]'
            : undefined
        }
      >
        <path d="M7.5 16.5 16.5 7.5M9 7.5h7.5V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
