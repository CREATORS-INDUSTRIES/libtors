import { Cells, Frame, FrameBox, Line } from './Page'
import Wordmark from './Wordmark'

export interface FooterLink {
  label: string
  href: string
  external?: boolean
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

const CELL = 'flex flex-col gap-4 border-b border-r border-white/10 px-6 py-5 md:py-6'
const MUTED = 'text-white/40 transition-colors hover:text-white'

// The footer continues the page frame, so the same lines and cells close the site.
export default function SiteFooter({
  sections,
  logo,
  copyright,
  location,
}: {
  sections: FooterSection[]
  logo: { src: string; alt: string }
  copyright: string
  location: string
}) {
  return (
    <Frame as="footer">
      <div className="dm-mono text-xs uppercase tracking-widest">
        <Line />
        <FrameBox>
          <Cells className="grid-cols-2 md:grid-cols-4">
            {/* Absolute so the mark takes the row height the link columns set, inside the cell's padding. */}
            <div className={`${CELL} relative`}>
              <img
                src={logo.src}
                alt={logo.alt}
                className="absolute left-6 top-5 h-[calc(100%-2.5rem)] w-auto md:top-6 md:h-[calc(100%-3rem)]"
              />
            </div>
            {sections.map((section) => (
              <div key={section.title} className={CELL}>
                <p className="text-white">{section.title}</p>
                <ul className="flex flex-col gap-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className={MUTED}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Cells>
        </FrameBox>
        <Line />
        <FrameBox>
          <Wordmark className="px-6 py-12 md:px-12 md:py-16" />
        </FrameBox>
        <Line />
        <FrameBox>
          <div className="flex items-center justify-between gap-6 px-6 py-6 text-white/40">
            <span>{copyright}</span>
            <span>{location}</span>
          </div>
        </FrameBox>
      </div>
    </Frame>
  )
}
