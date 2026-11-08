import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router'
import ExternalLinkIcon from './icons/ExternalLinkIcon'

export interface NavItem {
  label: string
  href: string
  description?: string
  image?: string
}

export interface NavSection {
  label: string
  /** Omit when the section has no page: its tab only opens the panel. */
  href?: string
  /** Paths the section owns: a page under one keeps that section lit. */
  owns: string[]
  /** Offered in a panel under the bar; a first item with an image is also featured. */
  items?: NavItem[]
  /** Heads the items when they aren't the section's own label. */
  itemsTitle?: string
}

function useSection(sections: NavSection[]) {
  const { pathname } = useLocation()
  return sections.find(({ owns }) => owns.some((path) => pathname === path || pathname.startsWith(`${path}/`)))?.label
}

const isExternal = (href: string) => /^https?:/.test(href)
const newTab = (href: string) => (isExternal(href) ? { target: '_blank', rel: 'noreferrer' } : {})

function ItemLabel({ label, href }: Pick<NavItem, 'label' | 'href'>) {
  return (
    <>
      {label}
      {isExternal(href) && (
        <ExternalLinkIcon
          width={14}
          height={14}
          className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      )}
    </>
  )
}

function NavPanel({ open, children }: { open: boolean; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const [bottom, setBottom] = useState<number>()

  useEffect(() => {
    if (open && panel.current) setBottom(panel.current.getBoundingClientRect().bottom)
  }, [open])

  return (
    <>
      {/* Portaled: the header's backdrop-filter makes it a backdrop root, so a blur inside it never reaches the page. */}
      {bottom !== undefined &&
        createPortal(
          <div
            aria-hidden
            style={{ top: bottom }}
            className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 backdrop-blur-md transition-[opacity,visibility] duration-150 ${
              open ? 'visible opacity-100' : 'invisible opacity-0'
            }`}
          />,
          document.body,
        )}
      {/* Sized against the header, the nearest containing block. The strip above keeps the hover
          alive on the diagonal from a centered tab to the content, across the rest of the bar. */}
      <div
        ref={panel}
        className={`absolute inset-x-0 top-[calc(100%+1px)] border-b border-white/10 bg-black transition-opacity duration-150 before:absolute before:inset-x-0 before:bottom-full before:h-5 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="mx-auto w-[calc(100%-4rem)] max-w-6xl border-x border-white/10">{children}</div>
      </div>
    </>
  )
}

function ItemList({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate: () => void }) {
  return (
    <>
      <p className="dm-mono mb-5 text-sm uppercase tracking-[0.18em] text-white/40">{title}</p>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              {...newTab(item.href)}
              onClick={onNavigate}
              className="manrope group inline-flex items-center gap-1.5 text-lg tracking-tight text-white/80 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              <ItemLabel {...item} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

function FeaturedItems({ label, href, title, feature, items, onNavigate }: {
  label: string
  href?: string
  title: string
  feature: NavItem
  items: NavItem[]
  onNavigate: () => void
}) {
  return (
    <div className="grid grid-cols-[3fr_2fr]">
      <Link
        to={feature.href}
        onClick={onNavigate}
        className="group relative block aspect-[2/1] overflow-hidden border-r border-white/10 focus-visible:outline-none"
      >
        <img
          src={feature.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
        <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.9),transparent_65%)]" />
        <span className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <span className="manrope block text-3xl font-semibold tracking-tight text-white">{feature.label}</span>
          {feature.description && (
            <span className="manrope mt-2 line-clamp-2 max-w-lg text-base leading-relaxed text-white/70">
              {feature.description}
            </span>
          )}
        </span>
      </Link>
      <div className="flex flex-col p-6 md:p-8">
        <ItemList title={title} items={items} onNavigate={onNavigate} />
        {href && (
          <Link
            to={href}
            onClick={onNavigate}
            aria-label={`All ${label}`}
            className="dm-mono mt-auto inline-flex self-end whitespace-nowrap rounded-full border border-white/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:border-white focus-visible:bg-white focus-visible:text-black focus-visible:outline-none"
          >
            All
          </Link>
        )}
      </div>
    </div>
  )
}

function NavTab({ label, href, items, itemsTitle = label, current }: NavSection & { current: boolean }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const tabClass = `dm-mono block rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors focus-visible:text-white focus-visible:outline-none ${
    current || (items && open) ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
  }`

  return (
    // No gap or padding around tabs: any dead strip between them drops the panel and the pointer cursor.
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
      // Keyboard only: a click leaves focus on the tab, which would reopen it when the window refocuses.
      onFocus={(e) => e.target.matches(':focus-visible') && setOpen(true)}
      onBlur={(e) => e.currentTarget.contains(e.relatedTarget) || close()}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.currentTarget.querySelector<HTMLElement>('a, button')?.focus()
        close()
      }}
    >
      {href ? (
        <Link
          to={href}
          onClick={close}
          aria-current={current ? 'page' : undefined}
          aria-expanded={items ? open : undefined}
          className={tabClass}
        >
          {label}
        </Link>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open} className={tabClass}>
          {label}
        </button>
      )}
      {items?.[0] && (
        <NavPanel open={open}>
          {items[0].image ? (
            <FeaturedItems label={label} href={href} title={itemsTitle} feature={items[0]} items={items} onNavigate={close} />
          ) : (
            <div className="p-6 md:p-8">
              <ItemList title={itemsTitle} items={items} onNavigate={close} />
            </div>
          )}
        </NavPanel>
      )}
    </div>
  )
}

export default function NavMenu({ sections }: { sections: NavSection[] }) {
  const current = useSection(sections)
  return (
    <div className="hidden items-center md:flex">
      {sections.map((section) => (
        <NavTab key={section.label} {...section} current={current === section.label} />
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
        {sections.map(({ label, href, items, itemsTitle }) => (
          <Fragment key={label}>
            {href ? (
              <Link
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
            ) : (
              <p className="dm-mono whitespace-nowrap border-b border-white/10 px-6 py-5 text-sm uppercase tracking-[0.18em] text-white/50">
                {label}
              </p>
            )}
            {itemsTitle && (
              <p className="dm-mono border-b border-white/10 py-4 pl-10 pr-6 text-xs uppercase tracking-[0.18em] text-white/40">
                {itemsTitle}
              </p>
            )}
            {items?.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                {...newTab(item.href)}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="manrope flex items-center gap-1.5 border-b border-white/10 py-4 pl-10 pr-6 text-sm text-white/70"
              >
                <ItemLabel {...item} />
              </Link>
            ))}
          </Fragment>
        ))}
      </nav>
    </div>
  )
}
