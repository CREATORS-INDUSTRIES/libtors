import { useId } from 'react'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
// The right leg's line: once lifted, the shackle turns half a revolution about it, as a real one does.
const PIVOT = '15.75px 0px'

// A padlock that opens in two moves: the shackle rises straight up clear of the body, then turns about its right
// leg until it hangs on the other side. Flattened to a scaleX through zero, which reads as that turn seen head on and
// animates the same in every browser, where a 3D rotate on SVG does not. Closing runs the moves backwards, turn
// first, so the free leg never cuts through the body.
export default function UnlockIcon({
  open,
  still = false,
  width = 16,
  height = 16,
  className = '',
}: {
  open: boolean
  /** Jumps to the state with no motion, for reduced motion. */
  still?: boolean
  width?: number
  height?: number
  className?: string
}) {
  const keyhole = useId()
  const lift = still ? 'none' : `transform 0.35s ${EASE} ${open ? '0s' : '0.5s'}`
  const swing = still ? 'none' : `transform 0.55s ${EASE} ${open ? '0.3s' : '0s'}`

  // Overflow shown: the turned shackle reaches past the box's right edge.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      overflow="visible"
      className={className}
    >
      <mask id={keyhole}>
        <rect width="24" height="24" fill="#fff" />
        <circle cx="12" cy="15.15" r="1.35" fill="#000" />
        <path d="M12 15.95v2.2" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
      </mask>
      <g style={{ transform: open ? 'translateY(-3px)' : 'none', transition: lift }}>
        <g style={{ transformBox: 'view-box', transformOrigin: PIVOT, transform: open ? 'scaleX(-1)' : 'none', transition: swing }}>
          {/* Legs run the lift's height into the body, hidden behind it when shut, so lifted they still meet it. */}
          <path d="M8.25 13.5V8.25a3.75 3.75 0 0 1 7.5 0v5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" />
        </g>
      </g>
      {/* Square shoulders under the shackle, a rounded base. */}
      <path
        d="M6 10.5h12a.75.75 0 0 1 .75.75v7.5a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a.75.75 0 0 1 .75-.75Z"
        fill="currentColor"
        mask={`url(#${keyhole})`}
      />
    </svg>
  )
}
