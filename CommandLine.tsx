import CopyIcon from './icons/CopyIcon'
import CheckIcon from './icons/CheckIcon'
import { useCopy } from './useCopy'

export type CommandLineSize = 'sm' | 'md'

export interface CommandLineProps {
  /** The command, as it is shown and as it is copied. */
  command: string
  /** What is copied, when that differs from what is shown (an abbreviated
   *  display, a command with a comment above it). Defaults to `command`. */
  copyText?: string
  /** Leading prompt glyph. `null` removes it. Defaults to `$`. */
  prompt?: string | null
  /** `sm` (11px) or `md` (12px). Defaults to `md`. */
  size?: CommandLineSize
  /** Announced to screen readers on copy. Defaults to "Command copied". */
  copiedLabel?: string
  className?: string
}

const SIZE: Record<CommandLineSize, { text: string; pad: string; glyph: number }> = {
  sm: { text: 'text-[11px]', pad: 'py-2 pl-3.5 pr-3', glyph: 12 },
  md: { text: 'text-[12px]', pad: 'py-2.5 pl-4 pr-3.5', glyph: 14 },
}

/**
 * A shell command as a copyable pill: the whole line is the button.
 *
 * A row whose only action is copying does not need a separate control for it,
 * and a bordered box reads as a component borrowed from elsewhere — this is a
 * pill because the pages that show install commands speak in pills.
 *
 *   <CommandLine command="curl -fsSL https://example.com/install.sh | sh" />
 *   <CommandLine command="npm i -g @crtrs/driver" prompt={null} size="sm" />
 */
export default function CommandLine({
  command,
  copyText,
  prompt = '$',
  size = 'md',
  copiedLabel = 'Command copied',
  className = '',
}: CommandLineProps) {
  const { copied, copy } = useCopy()
  const s = SIZE[size]

  return (
    <>
      <button
        type="button"
        onClick={() => copy(copyText ?? command)}
        aria-label={`Copy command: ${command}`}
        className={`group flex max-w-full items-center gap-2.5 rounded-full bg-black/[0.04] transition-colors hover:bg-black/[0.07] ${s.pad} ${className}`}
      >
        {prompt !== null && (
          <span className={`font-mono select-none leading-none text-black/25 ${s.text}`}>{prompt}</span>
        )}
        {/* A command longer than the viewport scrolls inside the pill rather
            than wrapping or being cut with an ellipsis: one with its tail
            hidden is one nobody can check before running it. Scrolling does not
            fire the copy — a touch that scrolls suppresses the click, and on a
            pointer device horizontal scroll is a separate gesture. */}
        <code className={`font-mono min-w-0 overflow-x-auto whitespace-nowrap text-left leading-none text-black/60 ${s.text}`}>
          {command}
        </code>
        {/* The tick replaces the clipboard in place, so copying never resizes
            the pill under the pointer. */}
        <span
          className="relative flex shrink-0 items-center justify-center text-black/30 transition-colors group-hover:text-black/60"
          style={{ width: s.glyph, height: s.glyph }}
        >
          {copied ? (
            <CheckIcon width={s.glyph} height={s.glyph} />
          ) : (
            <CopyIcon width={s.glyph} height={s.glyph} />
          )}
        </span>
      </button>
      {/* Swapping the icon is silent to a screen reader; this is what says it. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </>
  )
}
