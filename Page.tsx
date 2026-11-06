import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { blurIn } from './blurIn'
import './motion.css'

// Frame and Rule crosses share this box, so every cross lands on a frame line.
const FRAME_BOX = 'mx-auto w-[calc(100%-4rem)] max-w-6xl'

// The framed column every page and the footer sit in. overflow-x-clip, not
// hidden: full-bleed lines may not scroll the page sideways, and sticky rails keep working.
// z-[1]: positioned or transformed cells flush with the frame would otherwise paint over its lines.
export function Frame({ as: Tag = 'div', children }: { as?: 'div' | 'footer'; children: ReactNode }) {
  return (
    <Tag className="relative w-full overflow-x-clip">
      <div
        aria-hidden
        className={`${FRAME_BOX} pointer-events-none absolute inset-0 z-[1] hidden border-x border-white/10 md:block`}
      />
      {children}
    </Tag>
  )
}

// The last block meets the footer with no gap, and a Band there drops its bottom line,
// since the footer opens with its own. fill keeps a short page a screen tall, footer
// below the fold; off, the footer follows the content.
export default function Page({ children, top = 'pt-32 md:pt-40', fill = true }: { children: ReactNode; top?: string; fill?: boolean }) {
  return (
    <Frame>
      <div className={`relative flex w-full flex-col items-center px-6 md:px-8 [&>*:last-child]:!mb-0 [&>[data-band]:last-child>[data-band-bottom]]:hidden ${fill ? 'min-h-screen' : ''} ${top}`}>
        {children}
      </div>
    </Frame>
  )
}

// The frame's content box, full width below md where the frame lines are hidden.
export function FrameBox({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="relative md:mx-auto md:w-[calc(100%-4rem)] md:max-w-6xl" style={style}>
      {children}
    </div>
  )
}

function Cross({ side }: { side: 'left' | 'right' }) {
  return (
    <span
      className={`absolute top-0 h-[0.5625rem] w-[0.5625rem] -translate-y-1/2 ${side === 'left' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-white/40 after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-white/40`}
    />
  )
}

// Undoes Page's horizontal padding to reach the viewport edges, so Rule and Band
// are only valid as direct children of Page.
export const BLEED = '-mx-6 w-[calc(100%+3rem)] md:-mx-8 md:w-[calc(100%+4rem)]'

// A full-width line with crosses where it meets the frame.
export function Line() {
  return (
    <div aria-hidden className="relative w-full border-t border-white/10">
      <div className={`${FRAME_BOX} relative hidden md:block`}>
        <Cross side="left" />
        <Cross side="right" />
      </div>
    </div>
  )
}

export function Rule({ className = 'my-20 md:my-28' }: { className?: string }) {
  return (
    <div className={`${BLEED} ${className}`}>
      <Line />
    </div>
  )
}

// Content that fills the frame: the frame lines are its sides and its own lines
// its top and bottom, so what goes inside draws inner dividers only. It also
// closes the section, so it never sits right next to a Rule.
export function Band({
  children,
  className = 'my-20 md:my-28',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div data-band className={`${BLEED} ${className}`}>
      <Line />
      <FrameBox style={style}>{children}</FrameBox>
      <div data-band-bottom>
        <Line />
      </div>
    </div>
  )
}

// Grid for a Band: cells draw their right and bottom rules, and the clipped
// 1px overhang drops the ones that would double the Band's edges.
export function Cells({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden">
      <div className={`-mb-px -mr-px grid ${className}`}>{children}</div>
    </div>
  )
}

const CHIP =
  'dm-mono rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.25em] text-white/70'

// Detail pages link the chip back to their index.
export function PageChip({ label, to }: { label: string; to?: string }) {
  if (!to) {
    return (
      <span className={CHIP} style={blurIn('0.15s')}>
        {label}
      </span>
    )
  }
  return (
    <Link to={to} className={`${CHIP} transition-colors hover:border-white/30 hover:text-white`} style={blurIn('0.15s')}>
      {label}
    </Link>
  )
}

// display: the creation-scale title, risen letter by letter instead of word by word.
// trail: a node that rises after the last word, as one more word.
export function PageTitle({ title, display, trail }: { title: string; display?: boolean; trail?: ReactNode }) {
  const words: ReactNode[] = display ? title.split('') : title.split(' ')
  const parts = trail ? [...words, trail] : words
  return (
    <h1
      className={`manrope flex flex-wrap justify-center font-medium tracking-tight ${display ? 'leading-[0.95]' : 'gap-x-[0.25em] leading-[1.08]'}`}
      style={{
        fontSize: display ? 'clamp(4rem, 12vw, 9rem)' : 'clamp(2rem, 5vw, 3.5rem)',
        letterSpacing: display ? '-0.05em' : '-0.03em',
        perspective: '600px',
      }}
    >
      {parts.map((part, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            transformOrigin: '50% 100%',
            transform: 'rotateX(90deg)',
            opacity: 0,
            animation: `libtors-word-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.25 + i * 0.08}s forwards`,
          }}
        >
          {part}
        </span>
      ))}
    </h1>
  )
}

export function PageHeader({
  chip,
  chipTo,
  title,
  titleTrail,
  lede,
  meta,
}: {
  chip: string
  chipTo?: string
  title: string
  titleTrail?: ReactNode
  lede?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="flex w-full max-w-3xl flex-col items-center text-center">
      <div className='flex flex-col justify-center items-center w-fit h-fit gap-6'>
        <PageChip label={chip} to={chipTo} />
        <PageTitle title={title} trail={titleTrail} />
      </div>
      {lede && (
        <p className="manrope max-w-[40rem] text-[0.95rem] leading-[1.8] text-white/85 md:text-base" style={blurIn('0.7s')}>
          {lede}
        </p>
      )}
      {meta && (
        <div
          className="dm-mono mt-5 flex flex-col items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.25em] text-white/50"
          style={blurIn('0.7s')}
        >
          {meta}
        </div>
      )}
    </header>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="manrope font-medium tracking-tight text-white text-balance"
      style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', letterSpacing: '-0.03em' }}
    >
      {children}
    </h2>
  )
}
