import { Link } from 'react-router'

export interface CreationEntry {
  slug: string
  date: string
  tag: string
  title: string
  summary: string
  video: string
  poster: string
}

// A cell of a hairline grid: the grid draws the top/left rules, each cell its bottom/right.
export default function CreationCard({ entry }: { entry: CreationEntry }) {
  return (
    <Link
      to={`/${entry.slug}`}
      className="group flex flex-col border-b border-r border-white/10 transition-colors duration-300 hover:bg-white/[0.03]"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <h2
          className="manrope absolute bottom-3 left-5 z-10 font-semibold leading-none tracking-tight text-white sm:bottom-5 sm:left-8"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          {entry.title}
        </h2>
        <video
          src={entry.video}
          poster={entry.poster}
          aria-label={entry.title}
          playsInline
          muted
          autoPlay
          loop
          preload="metadata"
          width={1280}
          height={720}
          className="block h-full w-full object-cover opacity-80 transition duration-500 group-hover:opacity-100"
        />
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="manrope whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {entry.tag}
          </span>
          <span className="dm-mono whitespace-nowrap text-xs uppercase tracking-[0.18em] text-white/40">
            {entry.date}
          </span>
        </div>
        <p className="manrope text-sm leading-relaxed text-white/60">{entry.summary}</p>
      </div>
    </Link>
  )
}
