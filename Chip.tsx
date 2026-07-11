import { type ReactNode } from 'react'

export type ChipVariant = 'neutral' | 'accent' | 'success' | 'danger' | 'warning'
export type ChipSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface ChipProps {
  children: ReactNode
  /** Color intent. Defaults to `neutral`. */
  variant?: ChipVariant
  /** `sm` (h-6), `md` (h-7), `lg` (h-8) or `xl` (h-9). Defaults to `md`. */
  size?: ChipSize
  /** Solid saturated fill with white text. Maximum at-a-glance separation. */
  solid?: boolean
  /** Renders as a toggle button; the active look is applied when true. */
  selected?: boolean
  /** Makes the chip clickable (renders a <button>). */
  onClick?: () => void
  /** Shows a trailing × that calls this instead of `onClick`. */
  onRemove?: () => void
  /** Leading icon. Rendered inside a circular badge (Vercel-style) that fills
   *  with the intent color when `selected`/`solid`. */
  icon?: ReactNode
  disabled?: boolean
  className?: string
}

// Vercel-style: bordered pill, faint tint, saturated text. `selected` deepens
// the border + fill. `badgeOn` is the filled icon-circle look (white glyph).
const VARIANT: Record<
  ChipVariant,
  { base: string; selected: string; badge: string; badgeOn: string }
> = {
  neutral: {
    base: 'border-black/15 bg-transparent text-black/70 hover:bg-black/[0.04]',
    selected: 'border-black/25 bg-black/[0.05] text-black',
    badge: 'border-current',
    badgeOn: 'bg-zinc-700 text-white',
  },
  accent: {
    base: 'border-transparent bg-[#0056ff]/20 text-[#0056ff] hover:bg-[#0056ff]/28',
    selected: 'border-transparent bg-[#0056ff]/28 text-[#0056ff]',
    badge: 'border-current',
    badgeOn: 'bg-[#0056ff] text-white',
  },
  success: {
    base: 'border-transparent bg-[#10d45e]/50 text-[#055f27] hover:bg-[#10d45e]/60',
    selected: 'border-transparent bg-[#10d45e]/60 text-[#055f27]',
    badge: 'border-current',
    badgeOn: 'bg-[#10d45e] text-white',
  },
  danger: {
    base: 'border-transparent bg-red-500/22 text-red-500 hover:bg-red-500/30',
    selected: 'border-transparent bg-red-500/30 text-red-500',
    badge: 'border-current',
    badgeOn: 'bg-red-500 text-white',
  },
  warning: {
    base: 'border-transparent bg-amber-500/24 text-amber-600 hover:bg-amber-500/32',
    selected: 'border-transparent bg-amber-500/32 text-amber-600',
    badge: 'border-current',
    badgeOn: 'bg-amber-500 text-white',
  },
}

// Solid saturated fill with white text (for the chip body, not the badge).
const SOLID: Record<ChipVariant, string> = {
  neutral: 'border-transparent bg-zinc-600 text-white',
  accent: 'border-transparent bg-[#0056ff] text-white',
  success: 'border-transparent bg-emerald-600 text-white',
  danger: 'border-transparent bg-red-500 text-white',
  warning: 'border-transparent bg-amber-500 text-white',
}

const SIZE: Record<ChipSize, { chip: string; pad: string; padIcon: string; badge: string; glyph: string }> = {
  sm: { chip: 'h-6 text-[11px] gap-1.5', pad: 'px-2.5', padIcon: 'pl-1 pr-2.5', badge: 'h-4 w-4', glyph: 'h-2.5 w-2.5' },
  md: { chip: 'h-7 text-xs gap-1.5', pad: 'px-3', padIcon: 'pl-1 pr-3', badge: 'h-5 w-5', glyph: 'h-3 w-3' },
  lg: { chip: 'h-8 text-sm gap-2', pad: 'px-3.5', padIcon: 'pl-1 pr-3.5', badge: 'h-6 w-6', glyph: 'h-3.5 w-3.5' },
  xl: { chip: 'h-9 text-base gap-2', pad: 'px-4', padIcon: 'pl-1.5 pr-4', badge: 'h-7 w-7', glyph: 'h-4 w-4' },
  xxl: { chip: 'h-10 text-xl gap-2', pad: 'px-4', padIcon: 'pl-1.5 pr-4', badge: 'h-9 w-9', glyph: 'h-4 w-4' },
}

/**
 * Compact pill for tags, filters, and statuses. Vercel-style bordered look.
 *
 *   <Chip variant="accent">Beta</Chip>
 *   <Chip variant="accent" icon={<ArrowUp/>} selected>Production</Chip>
 *   <Chip variant="success" solid>Done</Chip>
 *   <Chip onRemove={() => drop(id)}>{label}</Chip>
 */
export default function Chip({
  children,
  variant = 'neutral',
  size = 'md',
  solid = false,
  selected = false,
  onClick,
  onRemove,
  icon,
  disabled = false,
  className = '',
}: ChipProps) {
  const v = VARIANT[variant]
  const s = SIZE[size]
  const interactive = !!onClick && !disabled
  const filled = solid // body fully filled
  const on = selected || solid // badge filled

  const tone = filled ? SOLID[variant] : selected ? v.selected : v.base
  const base =
    `inline-flex items-center rounded-full border font-mono whitespace-nowrap transition-colors ` +
    `${s.chip} ${icon ? s.padIcon : s.pad} ${tone} ` +
    `${interactive ? 'cursor-pointer' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`

  const badgeTone = on ? (filled ? 'bg-white/20 text-white border-transparent' : v.badgeOn) : v.badge

  const inner = (
    <>
      {icon && (
        <span
          className={`shrink-0 inline-flex items-center justify-center rounded-full border ${s.badge} ${badgeTone}`}
        >
          <span className={`inline-flex items-center justify-center ${s.glyph}`}>{icon}</span>
        </span>
      )}
      <span className="truncate">{children}</span>
      {onRemove && (
        <span
          role="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) onRemove()
          }}
          className="shrink-0 -mr-0.5 ml-0.5 inline-flex items-center justify-center rounded-full opacity-60 hover:opacity-100"
        >
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </span>
      )}
    </>
  )

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        className={base}
      >
        {inner}
      </button>
    )
  }

  return <span className={base}>{inner}</span>
}
