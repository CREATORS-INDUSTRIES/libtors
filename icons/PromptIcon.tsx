import { motion } from 'motion/react'

/* A shell prompt: the caret and a cursor that blinks once on `active`, then
   holds — the terminal mockups' ink without a loop left running. */

export default function PromptIcon({ active = false, className = '' }: { active?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`flex h-5 w-[13px] items-center gap-[3px] ${className}`}>
      <svg width={9} height={9} viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-70">
        <path d="M5 5l7 7-7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <motion.span
        className="block h-[2px] w-2 rounded-full bg-current"
        animate={active ? { opacity: [0.35, 0.1, 1], width: [8, 8, 11] } : { opacity: 0.35, width: 8 }}
        transition={active ? { duration: 0.5, times: [0, 0.4, 1], ease: 'easeOut' } : { duration: 0.2 }}
      />
    </span>
  )
}
