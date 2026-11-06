import CheckIcon from './icons/CheckIcon'
import LinkIcon from './icons/LinkIcon'
import { useCopy } from './useCopy'

// Share = copy the post's canonical link. No share sheets, no trackers.
export default function ShareButton({ url }: { url?: string }) {
  const { copied, copy } = useCopy(2000)

  return (
    <button
      onClick={() => copy(url ?? window.location.href)}
      className="dm-mono inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/70 transition-colors hover:border-white/30 hover:text-white"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}
