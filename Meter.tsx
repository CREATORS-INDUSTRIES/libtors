export type MeterVariant = 'accent' | 'danger'

export interface MeterProps {
  /** Fill fraction, 0..1. Values outside the range are clamped. */
  value: number
  /** Fill color intent: accent (default) or danger for exhausted/critical. */
  variant?: MeterVariant
  width?: number
  height?: number
  className?: string
}

const FILL: Record<MeterVariant, string> = {
  accent: 'bg-[#0056ff]',
  danger: 'bg-red-500',
}

/**
 * A static fill meter: quota, capacity, usage. Unlike ProgressBar (a timed
 * loading bar) this just renders a fraction.
 *
 *   <Meter value={used / limit} />
 *   <Meter value={1} variant="danger" />
 */
export default function Meter({ value, variant = 'accent', width = 64, height = 4, className = '' }: MeterProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className={`rounded-full bg-black/[0.08] overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${FILL[variant]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
