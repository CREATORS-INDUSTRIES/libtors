import { type ReactNode, type ButtonHTMLAttributes } from 'react'

export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The icon to render (usually an inline <svg>). */
  icon: ReactNode
  /** Accessible label — also used as the tooltip when `title` is unset. */
  label: string
  /** Square footprint. Defaults to `md` (h-8). */
  size?: IconButtonSize
  className?: string
}

const SIZE: Record<IconButtonSize, { box: string; glyph: string }> = {
  sm: { box: 'h-7 w-7', glyph: '[&_svg]:h-3.5 [&_svg]:w-3.5' },
  md: { box: 'h-8 w-8', glyph: '[&_svg]:h-4 [&_svg]:w-4' },
  lg: { box: 'h-10 w-10', glyph: '[&_svg]:h-5 [&_svg]:w-5' },
}

/**
 * A boxed icon button: bordered square with a subtle background on hover.
 * The shared concept behind back / refresh / expand controls.
 *
 *   <IconButton label="Back" icon={<ArrowLeft/>} onClick={goBack} />
 */
export default function IconButton({
  icon,
  label,
  size = 'md',
  className = '',
  title,
  ...props
}: IconButtonProps) {
  const s = SIZE[size]
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={label}
      className={`group inline-flex shrink-0 items-center justify-center rounded-lg border border-black/20 bg-white text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${s.box} ${s.glyph} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}
