import type { ReactNode } from 'react'

// Hand-rolled highlighting for the research code blocks: brand blues over
// the base white/85, no external dependency.
export type Lang = 'skill' | 'term' | 'js' | 'bibtex' | 'rust'

const ACCENT = 'text-[#ad5cff]'
const STR = 'text-[#ff7a1a]'
const DIM = 'text-white/40'

function matchTokens(
  text: string,
  pattern: RegExp,
  classFor: (m: RegExpExecArray) => string,
  keyPrefix: string,
): ReactNode[] {
  const out: ReactNode[] = []
  const re = new RegExp(pattern.source, pattern.flags)
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <span key={`${keyPrefix}-${i++}`} className={classFor(m)}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function highlightJs(code: string): ReactNode[] {
  return matchTokens(
    code,
    /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*')|\b(const|await|require)\b/g,
    (m) => (m[1] ? DIM : m[2] ? STR : ACCENT),
    'js',
  )
}

// Also covers Self source: its surface syntax is a subset of these keywords.
function highlightRust(code: string): ReactNode[] {
  return matchTokens(
    code,
    /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|\b(fn|let|mut|struct|enum|pub|impl|match|if|else|while|return|import)\b/g,
    (m) => (m[1] ? DIM : m[2] ? STR : ACCENT),
    'rs',
  )
}

function highlightBibtex(code: string): ReactNode[] {
  return matchTokens(
    code,
    /(@\w+)|(^ *\w+(?= *=))|([{}=,])/gm,
    (m) => (m[3] ? DIM : ACCENT),
    'bib',
  )
}

// SKILL.md: prose stays plain; frontmatter and tool fences get key/value
// treatment, $params inside run templates stand out.
function highlightSkill(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let structured = false
  code.split('\n').forEach((line, li) => {
    if (li > 0) out.push('\n')
    if (line.trim() === '---') {
      structured = !structured
      out.push(
        <span key={`sk-${li}`} className={DIM}>
          {line}
        </span>,
      )
      return
    }
    if (line.startsWith('```')) {
      const fenceLang = line.slice(3)
      structured = fenceLang.length > 0
      out.push(
        <span key={`sk-${li}-f`} className={DIM}>
          {'```'}
        </span>,
      )
      if (fenceLang) {
        out.push(
          <span key={`sk-${li}-l`} className={ACCENT}>
            {fenceLang}
          </span>,
        )
      }
      return
    }
    const kv = structured ? line.match(/^(\s*)([\w-]+):(.*)$/) : null
    if (kv) {
      const [, indent, key, rest] = kv
      out.push(indent)
      out.push(
        <span key={`sk-${li}-k`} className={ACCENT}>
          {key}
        </span>,
      )
      out.push(
        <span key={`sk-${li}-c`} className={DIM}>
          :
        </span>,
      )
      out.push(...matchTokens(rest, /\$\w+/g, () => STR, `sk-${li}-v`))
      return
    }
    out.push(line)
  })
  return out
}

function highlightTerm(code: string): ReactNode[] {
  const out: ReactNode[] = []
  code.split('\n').forEach((line, li) => {
    if (li > 0) out.push('\n')
    if (line.startsWith('$ ')) {
      out.push(
        <span key={`t-${li}-p`} className={DIM}>
          $
        </span>,
      )
      out.push(...matchTokens(line.slice(1), /"[^"\n]*"/g, () => STR, `t-${li}`))
      return
    }
    if (/^\s*│/.test(line)) {
      out.push(
        <span key={`t-${li}`} className={DIM}>
          {line}
        </span>,
      )
      return
    }
    if (line.includes('✓')) {
      const idx = line.indexOf('✓')
      out.push(line.slice(0, idx))
      out.push(
        <span key={`t-${li}-c`} className={ACCENT}>
          ✓
        </span>,
      )
      out.push(
        <span key={`t-${li}-r`} className={DIM}>
          {line.slice(idx + 1)}
        </span>,
      )
      return
    }
    if (line.includes('·')) {
      out.push(
        <span key={`t-${li}`} className={DIM}>
          {line}
        </span>,
      )
      return
    }
    const call = line.match(/^(\s*)(\w+)\((.*)\)$/)
    if (call) {
      const [, indent, name, args] = call
      out.push(indent)
      out.push(
        <span key={`t-${li}-n`} className={ACCENT}>
          {name}
        </span>,
      )
      out.push(
        <span key={`t-${li}-o`} className={DIM}>
          (
        </span>,
      )
      out.push(args)
      out.push(
        <span key={`t-${li}-x`} className={DIM}>
          )
        </span>,
      )
      return
    }
    out.push(line)
  })
  return out
}

export function highlight(code: string, lang: Lang): ReactNode[] {
  if (lang === 'js') return highlightJs(code)
  if (lang === 'bibtex') return highlightBibtex(code)
  if (lang === 'rust') return highlightRust(code)
  if (lang === 'skill') return highlightSkill(code)
  return highlightTerm(code)
}
