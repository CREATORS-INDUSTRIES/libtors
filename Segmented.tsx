import { type ReactNode } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  /** Optional leading glyph. */
  icon?: ReactNode
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}

const SIZE = {
  sm: { seg: 'h-7 px-3 text-[11px]', gap: 'gap-0.5', pad: 'p-0.5' },
  md: { seg: 'h-9 px-4 text-xs', gap: 'gap-1', pad: 'p-1' },
}

/**
 * Horizontal segmented selector — a rounded pill track with one active
 * segment. Single-select; the active segment fills with the accent color.
 *
 *   <Segmented
 *     options={[{ value: 'all', label: 'All' }, { value: 'a', label: 'A' }]}
 *     value={v}
 *     onChange={setV}
 *   />
 */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = '',
}: SegmentedProps<T>) {
  const s = SIZE[size]
  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-lg border border-black/15 bg-black/[0.03]  ${s.pad} ${s.gap} ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-md font-mono uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${s.seg} ${active
                ? 'bg-gray-200'
                : 'text-black/55 hover:text-black hover:bg-black/[0.04]'
              }`}
          >
            {opt.icon && <span className="shrink-0 inline-flex items-center">{opt.icon}</span>}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
