// A marker bar over withheld words, in the text's own color. Sized by a hidden stamp so it
// matches a redaction label without showing one; the real words never reach the DOM.
export default function Redacted({ className = '' }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Redacted"
      className={`inline-block select-none bg-current px-[0.25em] text-[0.8em] ${className}`}
    >
      <span aria-hidden className="dm-mono invisible uppercase">
        [redacted]
      </span>
    </span>
  )
}
