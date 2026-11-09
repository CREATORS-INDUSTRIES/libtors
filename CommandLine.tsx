import { Link } from 'react-router'
import CopyIcon from './icons/CopyIcon'
import CheckIcon from './icons/CheckIcon'
import ExternalLinkIcon from './icons/ExternalLinkIcon'
import { useCopy } from './useCopy'

export type CommandLineSize = 'sm' | 'md' | 'lg'
export type CommandLineTheme = 'light' | 'dark'

export interface CommandLineLink {
  /** A route on this site, or an absolute URL that opens in a new tab. */
  href: string
  /** Read by screen readers, since the control shows only an icon. */
  label: string
}

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
  /** Where the command comes from, behind a divider at the pill's end. */
  link?: CommandLineLink
  className?: string
}

const TONE: Record<
  CommandLineTheme,
  { bg: string; hover: string; prompt: string; command: string; glyph: string; line: string; divider: string }
> = {
  light: {
    bg: 'bg-black/[0.04]',
    hover: 'hover:bg-black/[0.07]',
    prompt: 'text-black/25',
    command: 'text-black/60',
    glyph: 'text-black/30 group-hover:text-black/60',
    line: 'border-black/[0.035]',
    divider: 'bg-black/[0.035]',
  },
  dark: {
    bg: 'bg-white/[0.06]',
    hover: 'hover:bg-white/[0.1]',
    prompt: 'text-white/30',
    command: 'text-white/75',
    glyph: 'text-white/35 group-hover:text-white/75',
    line: 'border-white/[0.05]',
    divider: 'bg-white/[0.05]',
  },
}

const SIZE: Record<CommandLineSize, { text: string; pad: string; linkPad: string; glyph: number }> = {
  sm: { text: 'text-[11px]', pad: 'py-2 pl-3.5 pr-3', linkPad: 'pl-2.5 pr-3', glyph: 12 },
  md: { text: 'text-[12px]', pad: 'py-2.5 pl-4 pr-3.5', linkPad: 'pl-3 pr-3.5', glyph: 14 },
  lg: { text: 'text-[15px]', pad: 'py-3 pl-5 pr-4', linkPad: 'pl-3.5 pr-4', glyph: 16 },
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
 *   <CommandLine command="npm install @crtrs/llm" link={{ href: '/llm', label: 'About @crtrs/llm' }} />
 */
export default function CommandLine({
  command,
  copyText,
  prompt = '$',
  size = 'md',
  theme = 'light',
  copiedLabel = 'Command copied',
  link,
  className = '',
}: CommandLineProps) {
  const { copied, copy } = useCopy()
  const s = SIZE[size]
  const t = TONE[theme]

  const copyButton = (
    <button
      type="button"
      onClick={() => copy(copyText ?? command)}
      aria-label={`Copy command: ${command}`}
      className={`group flex items-center gap-2.5 transition-colors ${t.hover} ${s.pad} ${
        link ? 'min-w-0 rounded-l-full' : `max-w-full rounded-full ${t.bg} ${className}`
      }`}
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
        {copied ? <CheckIcon width={s.glyph} height={s.glyph} /> : <CopyIcon width={s.glyph} height={s.glyph} />}
      </span>
    </button>
  )

  return (
    <>
      {link ? (
        // Two controls in one pill: each half lights on its own, so the divider says which one the pointer is on.
        <div className={`flex max-w-full items-stretch rounded-full border ${t.line} ${t.bg} ${className}`}>
          {copyButton}
          <span aria-hidden className={`w-px shrink-0 ${t.divider}`} />
          <Link
            to={link.href}
            {...(/^https?:/.test(link.href) && { target: '_blank', rel: 'noreferrer' })}
            aria-label={link.label}
            className={`group flex shrink-0 items-center rounded-r-full transition-colors ${t.hover} ${s.linkPad}`}
          >
            <ExternalLinkIcon
              width={s.glyph}
              height={s.glyph}
              className={`transition-colors ${t.glyph}`}
              nudge
            />
          </Link>
        </div>
      ) : (
        copyButton
      )}
      {/* Swapping the icon is silent to a screen reader; this is what says it. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </>
  )
}
