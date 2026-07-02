export interface MeterProps {
  /** Fill fraction, 0..1. Values outside the range are clamped. */
  value: number
  width?: number
  height?: number
  className?: string
}

/**
 * A static fill meter: quota, capacity, usage. Unlike ProgressBar (a timed
 * loading bar) this just renders a fraction.
 *
 *   <Meter value={used / limit} />
 */
export default function Meter({ value, width = 64, height = 4, className = '' }: MeterProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className={`rounded-full bg-black/[0.08] overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <div
        className="h-full rounded-full bg-[#0056ff] transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
