import { type ReactNode, type ButtonHTMLAttributes } from 'react'

export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The icon to render (usually an inline <svg>). */
  icon: ReactNode
  /** Accessible label — also used as the tooltip when `title` is unset. */
  label: string
  /** Optional inline text next to the icon: turns the square into a pill. */
  text?: string
  /** Which side the icon sits on relative to `text`. Defaults to `right`. */
  iconPosition?: 'left' | 'right'
  /** Square footprint (or pill height when `text` is set). Defaults to `md` (h-8). */
  size?: IconButtonSize
  className?: string
}

const SIZE: Record<IconButtonSize, { box: string; pill: string; glyph: string; text: string }> = {
  sm: { box: 'h-7 w-7', pill: 'h-7 px-2 gap-1.5', glyph: '[&_svg]:h-3.5 [&_svg]:w-3.5', text: 'text-xs' },
  md: { box: 'h-8 w-8', pill: 'h-8 px-2.5 gap-1.5', glyph: '[&_svg]:h-4 [&_svg]:w-4', text: 'text-xs' },
  lg: { box: 'h-10 w-10', pill: 'h-10 px-3 gap-2', glyph: '[&_svg]:h-5 [&_svg]:w-5', text: 'text-sm' },
}

/**
 * A boxed icon button: bordered square with a subtle background on hover.
 * The shared concept behind back / refresh / expand controls.
 *
 *   <IconButton label="Back" icon={<ArrowLeft/>} onClick={goBack} />
 *   <IconButton label="Integration docs" text="Docs" icon={<External/>} onClick={openDocs} />
 */
export default function IconButton({
  icon,
  label,
  text,
  iconPosition = 'right',
  size = 'md',
  className = '',
  title,
  ...props
}: IconButtonProps) {
  const s = SIZE[size]
  const textEl = text && <span className={`${s.text} font-mono`}>{text}</span>
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={label}
      className={`group inline-flex shrink-0 items-center justify-center rounded-lg border border-black/20 bg-white text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${text ? s.pill : s.box} ${s.glyph} ${className}`}
      {...props}
    >
      {iconPosition === 'left' ? (
        <>
          {icon}
          {textEl}
        </>
      ) : (
        <>
          {textEl}
          {icon}
        </>
      )}
    </button>
  )
}
