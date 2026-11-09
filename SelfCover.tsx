import { useId, type ReactNode } from 'react'
import { CARD_GRAIN } from './grain'

const PAPER = '#e4e1da'

// 16:9 user space, split at the horizon.
const W = 160
const H = 90
const CX = W / 2
// Below center so the name above the steps has room in the dark half.
const HORIZON = 63

const TEXT_BASELINE = HORIZON - 19
const STEP = 12
// A block that tumbles forward on its own, each pose derived from the last.
const STEPS = [
  { cx: CX - 24, angle: 0 },
  { cx: CX - 8, angle: 15 },
  { cx: CX + 8, angle: 30 },
  { cx: CX + 24, angle: 45 },
]

// Research card cover for Self: name and figures cross the horizon and invert on the other side, their own reflection.
export default function SelfCover() {
  const id = useId()
  const grid = `${id}-grid`
  const top = `${id}-top`
  const bottom = `${id}-bottom`

  // Draws a figure twice: one fill above the horizon, its inverse below.
  const mirrored = (figure: (fill: string) => ReactNode) => (
    <>
      <g clipPath={`url(#${top})`}>{figure(PAPER)}</g>
      <g clipPath={`url(#${bottom})`}>{figure('#000')}</g>
    </>
  )

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden>
        <defs>
          <pattern id={grid} width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="#000" />
            <path d="M5 0H0V5" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="0.25" />
          </pattern>
          <clipPath id={top}>
            <rect width={W} height={HORIZON} />
          </clipPath>
          <clipPath id={bottom}>
            <rect y={HORIZON} width={W} height={H - HORIZON} />
          </clipPath>
        </defs>

        <rect width={W} height={HORIZON} fill={`url(#${grid})`} />
        <rect y={HORIZON} width={W} height={H - HORIZON} fill={PAPER} />

        {mirrored((fill) => (
          <>
            <text
              x={CX}
              y={TEXT_BASELINE}
              textAnchor="middle"
              fill={fill}
              fontSize="30"
              fontWeight="600"
              letterSpacing="-1.3"
              className="manrope"
            >
              self
            </text>
            {STEPS.map(({ cx, angle }) => (
              <rect
                key={cx}
                x={cx - STEP / 2}
                y={HORIZON - STEP / 2}
                width={STEP}
                height={STEP}
                fill={fill}
                transform={`rotate(${angle} ${cx} ${HORIZON})`}
              />
            ))}
          </>
        ))}
      </svg>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3] mix-blend-overlay"
        style={{ backgroundImage: CARD_GRAIN }}
      />
    </div>
  )
}
