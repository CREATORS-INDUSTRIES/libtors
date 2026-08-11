import { type ReactNode } from 'react'
import CheckIcon from './icons/CheckIcon'

export interface StepDef {
  id: string
  title: string
  /** Drawn under the title while this step is the active one. */
  body?: ReactNode
  /** One line that replaces the body once the step is done. */
  summary?: ReactNode
}

export interface StepsProps {
  steps: StepDef[]
  /** Ids that are complete. Order does not matter. */
  done?: string[]
  /** The step being worked on. Defaults to the first one not in `done`. */
  activeId?: string
  className?: string
}

/**
 * A short ordered list of things to do, one of them open at a time.
 *
 * The caller owns what is done and what is active: this draws that state and
 * keeps none of its own, so progress can be derived from the server on every
 * mount rather than accumulated here and left to go stale.
 *
 *   <Steps
 *     steps={[{ id: 'key', title: 'Create a key', body: <CreateKey/> }]}
 *     done={['verify']}
 *   />
 */
export default function Steps({ steps, done = [], activeId, className = '' }: StepsProps) {
  const complete = new Set(done)
  const active = activeId ?? steps.find((s) => !complete.has(s.id))?.id

  return (
    <div className={`rounded-lg border border-black/20 bg-white divide-y divide-black/20 ${className}`}>
      {steps.map((step, i) => {
        const isDone = complete.has(step.id)
        const isActive = step.id === active
        // A step that is neither open nor finished is a promise, not an
        // instruction: it stays readable and stops competing for the eye.
        const waiting = !isDone && !isActive

        return (
          <div
            key={step.id}
            className={`flex gap-3.5 px-5 py-4 transition-opacity ${waiting ? 'opacity-40' : ''}`}
          >
            {/* The number becomes the tick in place, so a finished step is read
                by the same mark that counted it a moment ago. */}
            <span
              className={`mt-px shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] tabular-nums ${isDone
                ? 'border-transparent bg-[#0056ff] text-white'
                : isActive
                  ? 'border-black/30 text-black'
                  : 'border-black/15 text-black/35'
                }`}
            >
              {isDone ? <CheckIcon width={12} height={12} /> : String(i + 1).padStart(2, '0')}
            </span>

            {/* A receipt sits right under its title -- they are one line of
                meaning. The open step's body is a block to work in, so it gets
                a little more room than a finished step's one line. */}
            <div className={`min-w-0 flex-1 flex flex-col ${isActive ? 'gap-2.5' : 'gap-1'}`}>
              <span className={`manrope text-sm leading-6 ${isDone ? 'text-black/50' : 'text-black'}`}>
                {step.title}
              </span>
              {/* Only the open step carries instructions. A finished one keeps
                  its receipt, so the page never grows into a wall of steps
                  nobody needs any more. */}
              {isActive && step.body}
              {/* A block, not a span: the receipt is a line of text for most
                  steps and a whole rendered result for the one that matters. */}
              {isDone && step.summary && (
                <div className="font-mono text-[11px] text-black/45 break-words">{step.summary}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
