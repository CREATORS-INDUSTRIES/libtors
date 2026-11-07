import type { ReactNode } from 'react'

const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

export type TooltipPlace = 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

// Where the chip opens, and the corner it grows from: the one nearest the trigger, so it seems to pop out of it.
const PLACE: Record<TooltipPlace, { position: string; origin: string }> = {
  top: { position: 'left-1/2 bottom-full mb-[0.25em] -translate-x-1/2', origin: '50% 100%' },
  bottom: { position: 'left-1/2 top-full mt-[0.25em] -translate-x-1/2', origin: '50% 0%' },
  'top-left': { position: 'right-[65%] bottom-[75%]', origin: '100% 100%' },
  'top-right': { position: 'left-[65%] bottom-[75%]', origin: '0% 100%' },
  'bottom-left': { position: 'right-[65%] top-[75%]', origin: '100% 0%' },
  'bottom-right': { position: 'left-[65%] top-[75%]', origin: '0% 0%' },
}

/**
 * A filled chip that pops out of its trigger while the pointer is over it or focus is inside it.
 * Decorative: the trigger must carry its own accessible name.
 *
 *   <Tooltip label="trust" color="#0056ff" place="bottom-left">
 *     <button aria-label="trust">…</button>
 *   </Tooltip>
 */
export default function Tooltip({
  label,
  color,
  ink = '#fff',
  place = 'bottom',
  children,
}: {
  label: string
  /** Chip fill. */
  color: string
  /** Chip text color; dark for light fills. */
  ink?: string
  place?: TooltipPlace
  children: ReactNode
}) {
  const { position, origin } = PLACE[place]
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span aria-hidden className={`pointer-events-none absolute z-[2147483647] ${position}`}>
        <span
          className="dm-mono block scale-75 whitespace-nowrap rounded-full px-5 py-2 text-sm font-normal uppercase tracking-[0.18em] opacity-0 transition duration-200 group-focus-within/tooltip:scale-100 group-focus-within/tooltip:opacity-100 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 md:text-base"
          style={{ background: color, color: ink, transformOrigin: origin, transitionTimingFunction: POP }}
        >
          {label}
        </span>
      </span>
    </span>
  )
}
