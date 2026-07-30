import { motion } from 'motion/react'

/* Two nodes and the branch between them, drawn once on `active`. */

export default function BranchIcon({ active = false, className = '' }: { active?: boolean; className?: string }) {
  return (
    <svg aria-hidden width={14} height={14} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
      <motion.path
        d="M6 7v4c0 3.4 2.6 6 6 6h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={false}
        animate={active ? { pathLength: [0, 1], opacity: 1 } : { pathLength: 1, opacity: 0.55 }}
        transition={active ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] } : { duration: 0.2 }}
      />
      <circle cx="6" cy="5" r="2.4" fill="currentColor" />
      <circle cx="18" cy="17" r="2.4" fill="currentColor" />
    </svg>
  )
}
