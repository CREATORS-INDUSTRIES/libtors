import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import './GradientButton.css'

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  // Border radius for the whole button, e.g. '1rem', '0.75rem', '9999px'.
  // The gradient rim and the inner surface derive from this single value.
  radius?: string
  // Extra classes for the inner (visible) surface: padding, text, colours.
  innerClassName?: string
}

// Animated gradient-border button. The border is a rotating conic gradient
// (see GradientButton.css); the inner surface sits on top with a radius 1.5px
// smaller so an even rim shows through. One `radius` drives both.
export default function GradientButton({
  children,
  className = '',
  innerClassName = '',
  radius = '1rem',
  ...rest
}: GradientButtonProps) {
  return (
    <button
      {...rest}
      style={{ borderRadius: radius, ...rest.style }}
      className={`gb-border group relative inline-flex p-[1.5px] disabled:opacity-50 ${className}`}
    >
      <span className="gb-solid" style={{ borderRadius: radius }} aria-hidden />
      <span
        style={{ borderRadius: `calc(${radius} - 1.5px)` }}
        className={`relative z-10 inline-flex items-center justify-center gap-2 bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-black ${innerClassName}`}
      >
        {children}
      </span>
    </button>
  )
}
