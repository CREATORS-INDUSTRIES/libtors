import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'

export interface NavSection {
  label: string
  href: string
  /** Paths the section owns: a page under one keeps that section lit. */
  owns: string[]
}

function useSection(sections: NavSection[]) {
  const { pathname } = useLocation()
  return sections.find(({ owns }) => owns.some((path) => pathname === path || pathname.startsWith(`${path}/`)))?.label
}

export default function NavMenu({ sections }: { sections: NavSection[] }) {
  const current = useSection(sections)
  return (
    <div className="hidden items-center gap-1 md:flex">
      {sections.map(({ label, href }) => (
        <Link
          key={label}
          to={href}
          aria-current={current === label ? 'page' : undefined}
          className={`dm-mono rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors focus-visible:text-white focus-visible:outline-none ${
            current === label ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

// Phones get the sections in a sheet under the bar, opened from a text toggle in its
// right slot. Absolute, not fixed: the sticky, blurred header is its containing block,
// so the sheet starts at the bar's bottom whether or not the news banner sits above.
export function MobileNav({ sections }: { sections: NavSection[] }) {
  const current = useSection(sections)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="dm-mono whitespace-nowrap px-1 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
      >
        {open ? 'Close' : 'Menu'}
      </button>
      <nav
        id="mobile-nav"
        className={`absolute inset-x-0 top-full h-[calc(100dvh-4rem)] border-t border-white/10 bg-black transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {sections.map(({ label, href }) => (
          <Link
            key={label}
            to={href}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            aria-current={current === label ? 'page' : undefined}
            className={`dm-mono block whitespace-nowrap border-b border-white/10 px-6 py-5 text-sm uppercase tracking-[0.18em] ${
              current === label ? 'text-white' : 'text-white/50'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
