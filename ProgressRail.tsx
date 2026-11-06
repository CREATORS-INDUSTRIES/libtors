import { useEffect, useState } from 'react'

// Where the reader is, never a way to jump: sections mark themselves with
// data-rail={key}, and the one crossing the middle of the viewport is lit. Only
// shown where the gutter outside the frame is wide enough to hold the labels.
export default function ProgressRail({ sections }: { sections: { key: string; label: string }[] }) {
  const [current, setCurrent] = useState<string>()

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent((entry.target as HTMLElement).dataset.rail)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    document.querySelectorAll('[data-rail]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  const first = sections[0]?.key
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-8 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 transition-opacity duration-500 2xl:flex"
      style={{ opacity: current && current !== first ? 1 : 0 }}
    >
      {sections.map(({ key, label }) => (
        <span
          key={key}
          className={`dm-mono whitespace-nowrap text-[0.6rem] uppercase tracking-[0.18em] transition-colors duration-300 ${key === current ? 'text-white' : 'text-white/30'}`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}
