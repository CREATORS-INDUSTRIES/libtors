import { motion } from 'motion/react'

/* Lines of a page: the middle one writes itself out once on `active` and stays
   written. */

const LINES = [13, 13, 8]

export default function DocLinesIcon({ active = false, className = '' }: { active?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`flex h-5 w-[13px] flex-col items-start justify-center gap-[3px] ${className}`}>
      {LINES.map((w, i) =>
        i === 1 ? (
          <span key={i} className="block h-[2px] overflow-hidden rounded-full" style={{ width: w }}>
            <motion.span
              className="block h-full w-full origin-left rounded-full bg-current"
              animate={active ? { scaleX: [0, 1], opacity: 1 } : { scaleX: 1, opacity: 0.3 }}
              transition={active ? { duration: 0.42, ease: [0.22, 1, 0.36, 1] } : { duration: 0.2 }}
            />
          </span>
        ) : (
          <motion.span
            key={i}
            className="block h-[2px] rounded-full bg-current"
            style={{ width: w }}
            animate={{ opacity: active ? 0.55 : 0.3 }}
            transition={{ duration: 0.2 }}
          />
        ),
      )}
    </span>
  )
}
