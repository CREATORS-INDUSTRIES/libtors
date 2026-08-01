import { useState } from 'react'
import CheckIcon from './icons/CheckIcon'
import { useCopy } from './useCopy'

export type CommandButtonSize = 'md' | 'lg'
export type CommandButtonVariant = 'pill' | 'plain'

export interface CommandButtonProps {
  /** The command: shown in the tooltip, copied on click. */
  command: string
  /** Accessible name. Defaults to "Copy install command". */
  label?: string
  /** `md` (h-10) or `lg` (h-[46px], the height of a hero CTA). Defaults to `lg`. */
  size?: CommandButtonSize
  /** `pill` stands on its own; `plain` carries no surface of its own and takes
   *  the colour of whatever it sits in — for a segment inside another button.
   *  Defaults to `pill`. */
  variant?: CommandButtonVariant
  className?: string
}

const SIZE: Record<CommandButtonSize, string> = {
  md: 'h-10 w-10',
  lg: 'h-[46px] w-[46px]',
}

// `plain` lights its whole segment on hover, like the other half of the button
// it sits in. The tint is an overlay of the inherited colour rather than a
// named background: a hover fill has to know whether it sits on white or on a
// saturated blue, and `currentColor` at low opacity does not — it darkens the
// light case and lightens the dark one on its own.
//
// It rounds its trailing end, because that is where this variant goes: the
// segment after a primary action, at the end of a pill.
const VARIANT: Record<CommandButtonVariant, string> = {
  pill: 'rounded-full bg-black/[0.04] text-black/45 hover:bg-black/[0.07] hover:text-black/70',
  plain:
    'relative rounded-r-full text-current before:absolute before:inset-0 before:rounded-[inherit] ' +
    'before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-[0.12]',
}

/**
 * The command behind an icon: a prompt glyph that reveals the whole command on
 * hover and copies it on click. For places that already have a primary action
 * — a download button, a docs link — and want the terminal route beside it
 * without a second thing competing for the eye.
 *
 *   <CommandButton command="curl -fsSL https://example.com/install.sh | sh" />
 *
 * The tooltip is the disclosure, so it shows the command in full: a copy
 * affordance that hides what it is about to put on the clipboard is asking for
 * trust it has not earned.
 */
export default function CommandButton({
  command,
  label = 'Copy install command',
  size = 'lg',
  variant = 'pill',
  className = '',
}: CommandButtonProps) {
  const { copied, copy } = useCopy()
  // Hover and keyboard focus both open it — a control only reachable by
  // pointer would hide the command from anyone tabbing through the page.
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => copy(command)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={label}
        className={`group flex shrink-0 items-center justify-center transition-colors ${SIZE[size]} ${VARIANT[variant]}`}
      >
        {/* The prompt is the icon: a $ says "this is a line you paste into a
            shell" to anyone who has ever seen one, with no glyph to learn. It
            gives way to a tick on copy, in a box sized for both so the segment
            never resizes.

            Positioned, because `plain` paints its hover tint with an absolutely
            positioned ::before — which would otherwise sit on top of the glyph
            rather than behind it. */}
        <span className="relative flex items-center justify-center opacity-75 transition-opacity group-hover:opacity-100">
          {copied ? <CheckIcon width={14} height={14} /> : <span className="font-mono text-[12px] leading-none">$</span>}
        </span>
      </button>

      {/* Above the button, wrapping rather than truncating: a command with its
          tail cut is one nobody can check before running.

          It is the same pill a command gets anywhere else on the page — round
          ends, faint grey, one line. Opaque grey rather than a 4% black tint:
          it floats over copy, and a translucent panel with a paragraph showing
          through it is not a panel.

          Centred on the button, and capped at the viewport width so it cannot
          be wider than the screen it has to fit on. It is still absolutely
          positioned around a point that is rarely the centre of the page, so a
          long command can reach past the right edge -- which is page-level
          horizontal scroll unless an ancestor clips it. Pages that use this
          near the middle of a narrow layout want `overflow-x-clip` on the
          section around it.

          pointer-events-none so the tooltip can never swallow the click that
          the button underneath it is waiting for. */}
      <span
        role="tooltip"
        aria-hidden={!open}
        // normal-case and tracking-normal are not defaults here: this can sit
        // inside a button whose label is uppercase and letter-spaced, and both
        // inherit — a command is a literal string, and a shell does not take
        // CURL -FSSL.
        className={`font-mono pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-full border border-black/[0.07] bg-[#f2f2f3] px-4 py-2.5 text-left text-[12px] normal-case leading-none tracking-normal text-black/60 transition-opacity duration-150 ${open ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {copied ? (
          'Copied to clipboard'
        ) : (
          <>
            <span className="select-none text-black/25">$</span>
            {command}
          </>
        )}
      </span>

      {/* The icon changing is silent; this is what a screen reader hears. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Command copied' : ''}
      </span>
    </div>
  )
}
