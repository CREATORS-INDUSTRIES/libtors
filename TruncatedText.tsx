import { useRef, useState } from 'react'

export interface TruncatedTextProps {
  /** The full text. Always what gets copied, regardless of truncation. */
  value: string
  /** Max characters shown before truncating with an ellipsis. */
  chars?: number
  /** Click copies the FULL value to the clipboard and flashes feedback. */
  copyable?: boolean
  className?: string
}

/**
 * A one-line text preview: shows at most `chars` characters, the rest becomes
 * an ellipsis (the full value stays available as the tooltip). With `copyable`
 * it turns into a click-to-copy control that always copies the full value.
 *
 *   <TruncatedText value={run.id} chars={12} copyable />
 */
export default function TruncatedText({
  value,
  chars = 24,
  copyable = false,
  className = '',
}: TruncatedTextProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const truncated = value.length > chars
  const preview = truncated ? `${value.slice(0, chars)}…` : value

  if (!copyable) {
    return (
      <span title={truncated ? value : undefined} className={className}>
        {preview}
      </span>
    )
  }

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1200)
  }

  // Copyable renders as an IconButton-style pill so it reads as a control.
  // The preview always occupies the layout (invisible while `copied`) so the
  // pill width never jumps; the feedback overlays it, centered.
  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? undefined : `${value} — click to copy`}
      className={`relative inline-flex shrink-0 items-center h-8 px-2.5 rounded-lg border border-black/20 bg-white text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black active:scale-95 ${className}`}
    >
      <span className={copied ? 'invisible' : undefined}>{preview}</span>
      {copied && (
        <span className="absolute inset-0 flex items-center justify-center">Copied</span>
      )}
    </button>
  )
}
