import { useState, type PointerEvent } from 'react'

export type MotorState = 'idle' | 'up' | 'down' | 'hold' | 'stall'
export type Mover = 'motor' | 'hand'

export interface SignalSample {
  /** ms since the run started */
  t: number
  /** mm along the travel, 0 at the bottom of the slot */
  position: number
  /** mm the controller is driving towards; null while it has no goal */
  target: number | null
  motor: MotorState
  /** what moved the lever since the last sample; null when it did not move */
  mover: Mover | null
}

export interface SignalEvent {
  t: number
  kind: 'command' | 'reply' | 'limit'
  text: string
}

export interface SignalRun {
  /** tab label, such as Sweep or Hold */
  title: string
  samples: SignalSample[]
  events: SignalEvent[]
}

export interface Span<T> {
  value: T
  from: number
  to: number
}

// Consecutive samples sharing a value become one span, closed at the next sample's
// time so spans tile the run with no gaps.
export function spans<T>(samples: SignalSample[], pick: (s: SignalSample) => T): Span<T>[] {
  const out: Span<T>[] = []
  samples.forEach((sample, i) => {
    const value = pick(sample)
    const to = samples[i + 1]?.t ?? sample.t
    const last = out[out.length - 1]
    if (last && last.value === value) last.to = to
    else out.push({ value, from: sample.t, to })
  })
  return out
}

const MOTOR_FILL: Record<MotorState, string> = {
  idle: 'bg-white/[0.04]',
  up: 'bg-white/[0.12]',
  down: 'bg-white/[0.12]',
  hold: 'bg-white/[0.22]',
  stall: 'bg-[#0056ff]/60',
}
const MOVER_FILL = { motor: 'bg-white/[0.12]', hand: 'bg-[#0056ff]/60' }
// Share of the run a span needs before its label fits inside it; the readout names the rest.
const LABEL_SHARE = 0.08
const MONO = 'dm-mono text-[0.6rem] uppercase tracking-[0.18em]'

function sampleAt(samples: SignalSample[], t: number) {
  let found = samples[0]
  for (const sample of samples) {
    if (sample.t > t) break
    found = sample
  }
  return found
}

function Band<T extends string>({ items, fill, start, length }: { items: { value: T; from: number; to: number }[]; fill: Record<T, string>; start: number; length: number }) {
  return (
    <div className="relative h-7">
      {items.map(({ value, from, to }) => {
        const share = (to - from) / length
        return (
          <div
            key={from}
            className={`absolute inset-y-0 flex items-center justify-center border-r border-black ${fill[value]}`}
            style={{ left: `${((from - start) / length) * 100}%`, width: `${share * 100}%` }}
          >
            {share >= LABEL_SHARE && <span className={`${MONO} whitespace-nowrap text-white/80`}>{value}</span>}
          </div>
        )
      })}
    </div>
  )
}

// Position against target over one run, with what the motor was doing and what moved
// the lever on the same clock. Events are numbered so a dialogue beside it can cite them.
export default function SignalChart({ run, travel, onHover }: { run: SignalRun; travel: number; onHover?: (t: number | null) => void }) {
  const { samples, events } = run
  const start = samples[0].t
  const length = samples[samples.length - 1].t - start
  const [at, setAt] = useState<number | null>(null)

  const x = (t: number) => ((t - start) / length) * 100
  const y = (mm: number) => (1 - mm / travel) * 100
  const position = samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.t)} ${y(s.position)}`).join(' ')
  const target = samples
    .map((s, i) => (s.target === null ? '' : `${samples[i - 1]?.target != null ? 'L' : 'M'}${x(s.t)} ${y(s.target)}`))
    .join(' ')
  const motor = spans(samples, (s) => s.motor)
  const mover = spans(samples, (s) => s.mover).filter((span): span is { value: 'motor' | 'hand'; from: number; to: number } => span.value !== null)

  const seconds = length / 1000
  const step = seconds > 16 ? 5 : seconds > 8 ? 2 : 1
  const ticks = Array.from({ length: Math.floor(seconds / step) + 1 }, (_, i) => i * step)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const t = start + Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1) * length
    setAt(t)
    onHover?.(t)
  }
  const leave = () => {
    setAt(null)
    onHover?.(null)
  }
  const current = at === null ? null : sampleAt(samples, at)

  return (
    <div className="flex flex-col gap-4">
      <div className={`${MONO} flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-white/50`}>
        <span className="whitespace-nowrap text-white">{run.title}</span>
        <span className="whitespace-nowrap tabular-nums">
          {current
            ? `${((current.t - start) / 1000).toFixed(2)} s · ${current.position.toFixed(1)} mm · ${current.motor}`
            : `${seconds.toFixed(1)} s · ${samples.length} samples`}
        </span>
      </div>

      <div className="grid grid-cols-[3.75rem_1fr] gap-x-3">
        <div className={`${MONO} relative h-48 text-white/40`}>
          <span className="absolute right-0 top-0 -translate-y-1/2 whitespace-nowrap">{travel} mm</span>
          <span className="absolute bottom-0 right-0 translate-y-1/2 whitespace-nowrap">0 mm</span>
        </div>

        <div className="relative row-span-3 touch-pan-y" onPointerMove={move} onPointerLeave={leave}>
          <div className="relative h-48 border-y border-white/10">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <path d={target} fill="none" stroke="#4d88ff" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
              <path d={position} fill="none" stroke="white" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Band items={motor} fill={MOTOR_FILL} start={start} length={length} />
            <Band items={mover} fill={MOVER_FILL} start={start} length={length} />
          </div>

          {events.map((event, i) => (
            <div key={i} className="pointer-events-none absolute inset-y-0 border-l border-dashed border-white/25" style={{ left: `${x(event.t)}%` }}>
              <span className={`${MONO} absolute -top-2.5 left-0 -translate-x-1/2 rounded border border-white/20 bg-black px-1 text-white/80`}>{i + 1}</span>
            </div>
          ))}
          {at !== null && <div className="pointer-events-none absolute inset-y-0 border-l border-white/60" style={{ left: `${x(at)}%` }} />}
        </div>

        <span className={`${MONO} mt-3 flex h-7 items-center justify-end whitespace-nowrap text-white/40`}>Motor</span>
        <span className={`${MONO} mt-2 flex h-7 items-center justify-end whitespace-nowrap text-white/40`}>Mover</span>

        <div />
        <div className={`${MONO} relative mt-3 h-3 text-white/40`}>
          {ticks.map((s) => (
            <span key={s} className="absolute -translate-x-1/2 whitespace-nowrap tabular-nums" style={{ left: `${(s / seconds) * 100}%` }}>
              {s} s
            </span>
          ))}
        </div>
      </div>

      <div className={`${MONO} flex flex-wrap items-center gap-x-6 gap-y-2 text-white/50`}>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="h-0.5 w-5 bg-white" />
          Position
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-5 border-t-2 border-dashed border-[#4d88ff]" />
          Target
        </span>
      </div>
    </div>
  )
}
