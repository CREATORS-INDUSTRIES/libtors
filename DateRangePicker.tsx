import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  /** YYYY-MM-DD */
  from: string
  /** YYYY-MM-DD */
  to: string
  onChange: (from: string, to: string) => void
  className?: string
}

const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

const pad = (n: number) => String(n).padStart(2, '0')

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const monthDays = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
const daysInYear = (y: number) => (isLeap(y) ? 366 : 365)

/** day-of-year (1-based) → {y, m, d} */
function doyToDate(year: number, doy: number): { y: number; m: number; d: number } {
  const total = daysInYear(year)
  const clamped = Math.max(1, Math.min(total, doy))
  let remaining = clamped
  for (let m = 0; m < 12; m++) {
    const md = monthDays(year, m)
    if (remaining <= md) return { y: year, m, d: remaining }
    remaining -= md
  }
  return { y: year, m: 11, d: 31 }
}

/** {y,m,d} → day-of-year (1-based) */
function dateToDoy(y: number, m: number, d: number): number {
  let doy = d
  for (let i = 0; i < m; i++) doy += monthDays(y, i)
  return doy
}

/** start day-of-year of month m (1-based) */
function monthStartDoy(y: number, m: number): number {
  let doy = 1
  for (let i = 0; i < m; i++) doy += monthDays(y, i)
  return doy
}

const fmt = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

const parseISO = (s: string): { y: number; m: number; d: number } | null => {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m: m - 1, d }
}

/**
 * libtors DateRangePicker — single-year accounting timeline.
 *
 * 12 vertical month bars at day-15 anchors, horizontal axis = year.
 * Click + drag to pick day-precision range. Range and anchors confined to
 * one year — if both endpoints fall in selected year, drag works; year
 * navigation via < > arrows.
 */
export default function DateRangePicker({ from, to, onChange, className = '' }: Props) {
  const fromParsed = parseISO(from)
  const toParsed = parseISO(to)

  const [year, setYear] = useState<number>(() => fromParsed?.y ?? toParsed?.y ?? new Date().getFullYear())
  const [drag, setDrag] = useState<{ anchorDoy: number; currentDoy: number } | null>(null)
  const [cursor, setCursor] = useState<{ doy: number; xPct: number } | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)
  const total = daysInYear(year)
  const today = new Date()
  const todayDoy = today.getFullYear() === year ? dateToDoy(year, today.getMonth(), today.getDate()) : null

  // selected range in current year (committed)
  const selected = useMemo(() => {
    if (!fromParsed || !toParsed) return null
    if (fromParsed.y !== year && toParsed.y !== year) return null
    const startDoy = fromParsed.y === year ? dateToDoy(year, fromParsed.m, fromParsed.d) : 1
    const endDoy = toParsed.y === year ? dateToDoy(year, toParsed.m, toParsed.d) : total
    return { startDoy, endDoy }
  }, [fromParsed, toParsed, year, total])

  function xToDoy(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 1
    const ratio = (clientX - rect.left) / rect.width
    return Math.max(1, Math.min(total, Math.round(ratio * total) || 1))
  }

  function updateCursor(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const doy = xToDoy(clientX)
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setCursor({ doy, xPct })
  }

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const doy = xToDoy(e.clientX)
    setDrag({ anchorDoy: doy, currentDoy: doy })
    updateCursor(e.clientX)
  }

  useEffect(() => {
    if (!drag) return
    function onMove(e: MouseEvent) {
      if (!drag) return
      setDrag({ anchorDoy: drag!.anchorDoy, currentDoy: xToDoy(e.clientX) })
      updateCursor(e.clientX)
    }
    function onUp(e: MouseEvent) {
      if (!drag) return
      const end = xToDoy(e.clientX)
      const startDoy = Math.min(drag.anchorDoy, end)
      const endDoy = Math.max(drag.anchorDoy, end)
      const start = doyToDate(year, startDoy)
      const finish = doyToDate(year, endDoy)
      onChange(fmt(start.y, start.m, start.d), fmt(finish.y, finish.m, finish.d))
      setDrag(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [drag, year, onChange])

  // preview range (during drag) or committed
  const preview = drag
    ? { startDoy: Math.min(drag.anchorDoy, drag.currentDoy), endDoy: Math.max(drag.anchorDoy, drag.currentDoy) }
    : selected

  const startPct = preview ? (preview.startDoy - 1) / total * 100 : 0
  const endPct = preview ? preview.endDoy / total * 100 : 0
  const widthPct = endPct - startPct

  const previewStart = preview ? doyToDate(year, preview.startDoy) : null
  const previewEnd = preview ? doyToDate(year, preview.endDoy) : null

  return (
    <div className={`flex flex-col gap-3 select-none ${className}`}>
      {/* Year nav + readout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setYear(y => y - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-mono uppercase tracking-widest text-gray-900 tabular-nums w-14 text-center">
            {year}
          </span>
          <button
            type="button"
            onClick={() => setYear(y => y + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            ›
          </button>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 tabular-nums">
          {previewStart && previewEnd
            ? `${fmt(previewStart.y, previewStart.m, previewStart.d)} - ${fmt(previewEnd.y, previewEnd.m, previewEnd.d)}`
            : 'sin rango'}
        </span>
      </div>

      {/* Track wrapper — relative so chip can escape overflow-hidden */}
      <div className="relative">
        <div
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={(e) => updateCursor(e.clientX)}
          onMouseLeave={() => setCursor(null)}
          className="relative h-16 w-full bg-gray-50 border border-gray-200 rounded-lg cursor-crosshair overflow-hidden"
        >
          {/* Selection band */}
          {preview && widthPct > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-yellow-400 pointer-events-none"
              style={{ left: `${startPct}%`, width: `${widthPct}%` }}
            />
          )}

          {/* Today marker */}
          {todayDoy != null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-blue-500/70 pointer-events-none"
              style={{ left: `${(todayDoy - 0.5) / total * 100}%` }}
            />
          )}

          {/* Cursor indicator */}
          {cursor && (
            <div
              className="absolute top-0 bottom-0 w-px bg-gray-400 pointer-events-none"
              style={{ left: `${cursor.xPct}%` }}
            />
          )}

          {/* Month vertical bars at day 1 (skip January — left edge) */}
          {MONTH_LABELS.map((_label, m) => {
            if (m === 0) return null
            const doy = monthStartDoy(year, m)
            const leftPct = (doy - 1) / total * 100
            const inRange = preview && doy >= preview.startDoy && doy <= preview.endDoy
            return (
              <div
                key={`bar-${m}`}
                className={`absolute top-0 bottom-0 w-px pointer-events-none ${inRange ? 'bg-yellow-600/40' : 'bg-gray-300'}`}
                style={{ left: `${leftPct}%` }}
              />
            )
          })}

          {/* Month labels centered within month span */}
          {MONTH_LABELS.map((label, m) => {
            const start = monthStartDoy(year, m)
            const md = monthDays(year, m)
            const center = start + md / 2 - 1
            const leftPct = center / total * 100
            const inRange = preview && center >= preview.startDoy && center <= preview.endDoy
            return (
              <div
                key={`lbl-${m}`}
                className="absolute top-1.5 -translate-x-1/2 pointer-events-none"
                style={{ left: `${leftPct}%` }}
              >
                <span className={`text-[9px] font-mono uppercase tracking-widest ${inRange ? 'text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Cursor chip — outside overflow-hidden, positioned relative to wrapper */}
        {cursor && (() => {
          const date = doyToDate(year, cursor.doy)
          const clamped = Math.max(0, Math.min(100, cursor.xPct))
          return (
            <div
              className="absolute bottom-1 pointer-events-none z-20 transition-transform duration-500 ease-out"
              style={{
                left: `${clamped}%`,
                transform: `translateX(${clamped < 10 ? '0%' : clamped > 90 ? '-100%' : '-50%'})`,
              }}
            >
              <div className="px-1.5 py-0.5 bg-gray-900 text-gray-100 text-[9px] font-mono uppercase tracking-widest rounded whitespace-nowrap tabular-nums">
                {pad(date.d)} {MONTH_LABELS[date.m]}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Day axis ticks: Jan 1, Apr 1, Jul 1, Oct 1, Dec 31 */}
      <div className="relative h-3 text-[9px] font-mono uppercase tracking-widest text-gray-400">
        {[0, 3, 6, 9].map(m => {
          const left = (monthStartDoy(year, m) - 1) / total * 100
          return (
            <span key={m} className="absolute top-0" style={{ left: `${left}%`, transform: m === 0 ? 'none' : 'translateX(-50%)' }}>
              1 {MONTH_LABELS[m]}
            </span>
          )
        })}
        <span className="absolute top-0 right-0">31 DIC</span>
      </div>
    </div>
  )
}
