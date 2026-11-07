import CopyIcon from './icons/CopyIcon'
import CheckIcon from './icons/CheckIcon'
import { useCopy } from './useCopy'

export type CommandLineSize = 'sm' | 'md' | 'lg'
export type CommandLineTheme = 'light' | 'dark'

export interface CommandLineProps {
  /** The command, as it is shown and as it is copied. */
  command: string
  /** What is copied, when that differs from what is shown (an abbreviated
   *  display, a command with a comment above it). Defaults to `command`. */
  copyText?: string
  /** Leading prompt glyph. `null` removes it. Defaults to `$`. */
  prompt?: string | null
  /** `sm` (11px), `md` (12px) or `lg` (15px). Defaults to `md`. */
  size?: CommandLineSize
  /** The page it sits on. Defaults to `light`. */
  theme?: CommandLineTheme
  /** Announced to screen readers on copy. Defaults to "Command copied". */
  copiedLabel?: string
  className?: string
}

const TONE: Record<CommandLineTheme, { pill: string; prompt: string; command: string; glyph: string }> = {
  light: {
    pill: 'bg-black/[0.04] hover:bg-black/[0.07]',
    prompt: 'text-black/25',
    command: 'text-black/60',
    glyph: 'text-black/30 group-hover:text-black/60',
  },
  dark: {
    pill: 'bg-white/[0.06] hover:bg-white/[0.1]',
    prompt: 'text-white/30',
    command: 'text-white/75',
    glyph: 'text-white/35 group-hover:text-white/75',
  },
}

const SIZE: Record<CommandLineSize, { text: string; pad: string; glyph: number }> = {
  sm: { text: 'text-[11px]', pad: 'py-2 pl-3.5 pr-3', glyph: 12 },
  md: { text: 'text-[12px]', pad: 'py-2.5 pl-4 pr-3.5', glyph: 14 },
  lg: { text: 'text-[15px]', pad: 'py-3 pl-5 pr-4', glyph: 16 },
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
  theme = 'light',
  copiedLabel = 'Command copied',
  className = '',
}: CommandLineProps) {
  const { copied, copy } = useCopy()
  const s = SIZE[size]
  const t = TONE[theme]

  return (
    <>
      <button
        type="button"
        onClick={() => copy(copyText ?? command)}
        aria-label={`Copy command: ${command}`}
        className={`group flex max-w-full items-center gap-2.5 rounded-full transition-colors ${t.pill} ${s.pad} ${className}`}
      >
        {prompt !== null && (
          <span className={`font-mono select-none leading-none ${t.prompt} ${s.text}`}>{prompt}</span>
        )}
        {/* A command longer than the viewport scrolls inside the pill rather
            than wrapping or being cut with an ellipsis: one with its tail
            hidden is one nobody can check before running it. Scrolling does not
            fire the copy — a touch that scrolls suppresses the click, and on a
            pointer device horizontal scroll is a separate gesture. */}
        <code className={`font-mono min-w-0 overflow-x-auto whitespace-nowrap text-left leading-none ${t.command} ${s.text}`}>
          {command}
        </code>
        {/* The tick replaces the clipboard in place, so copying never resizes
            the pill under the pointer. */}
        <span
          className={`relative flex shrink-0 items-center justify-center transition-colors ${t.glyph}`}
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
