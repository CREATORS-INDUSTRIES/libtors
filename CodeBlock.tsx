import { highlight, type Lang } from './highlight'
import { useCopy } from './useCopy'

export function CodeBlock({ children, lang }: { children: string; lang: Lang }) {
  return (
    <pre className="dm-mono overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04] p-5 text-[0.8rem] leading-relaxed text-white/85">
      {highlight(children, lang)}
    </pre>
  )
}

// BibTeX block with a copy footer, Anthropic-style.
export function CitationBlock({ citation }: { citation: string }) {
  const { copied, copy } = useCopy(2000)
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
      <pre className="dm-mono overflow-x-auto p-5 text-[0.8rem] leading-relaxed text-white/85">
        {highlight(citation, 'bibtex')}
      </pre>
      <button
        type="button"
        onClick={() => copy(citation)}
        className="dm-mono flex w-full items-center justify-end gap-2 border-t border-white/10 px-5 py-3 text-[0.65rem] uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
