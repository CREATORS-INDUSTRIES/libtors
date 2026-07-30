import { motion } from 'motion/react'

/* The loop, running: three steps stacked like the rows of an execution. When
   `active` they light in order once and stay lit — a single pass per hover, no
   animation left ticking behind the pointer. */

const STEPS = [12, 8, 10]

export default function RunLoopIcon({ active = false, className = '' }: { active?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`flex h-5 w-[13px] flex-col items-start justify-center gap-[3px] ${className}`}>
      {STEPS.map((w, i) => (
        <motion.span
          key={i}
          className="block h-[2px] rounded-full bg-current"
          style={{ width: w }}
          animate={{ opacity: active ? 1 : i === 0 ? 0.6 : 0.22 }}
          transition={active ? { duration: 0.28, delay: i * 0.09, ease: 'easeOut' } : { duration: 0.2 }}
        />
      ))}
    </span>
  )
}
