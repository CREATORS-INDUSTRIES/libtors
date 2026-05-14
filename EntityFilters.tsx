import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import type { FilterDef } from './data/provider'
import DateRangePicker from './DateRangePicker'

interface Props {
  filters: FilterDef[]
  onApply: (params: Record<string, unknown>) => void
  onClear: () => void
  showClear: boolean
  localFilters: Record<string, unknown>
}

interface FilterValues {
  [key: string]: { from: string; to: string } | string
}

const fmt = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const datePresets = (): { label: string; from: string; to: string }[] => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const q = Math.floor(m / 3)
  const startOfMonth = (yy: number, mm: number) => new Date(yy, mm, 1)
  const endOfMonth = (yy: number, mm: number) => new Date(yy, mm + 1, 0)
  return [
    { label: 'Año actual', from: fmt(new Date(y, 0, 1)), to: fmt(new Date(y, 11, 31)) },
    { label: 'Año pasado', from: fmt(new Date(y - 1, 0, 1)), to: fmt(new Date(y - 1, 11, 31)) },
    { label: 'Mes actual', from: fmt(startOfMonth(y, m)), to: fmt(endOfMonth(y, m)) },
    { label: 'Mes pasado', from: fmt(startOfMonth(y, m - 1)), to: fmt(endOfMonth(y, m - 1)) },
    { label: 'Trimestre actual', from: fmt(startOfMonth(y, q * 3)), to: fmt(endOfMonth(y, q * 3 + 2)) },
    { label: 'Trimestre pasado', from: fmt(startOfMonth(y, q * 3 - 3)), to: fmt(endOfMonth(y, q * 3 - 1)) },
  ]
}

export default function EntityFilters({ filters, onApply, onClear, showClear, localFilters }: Props) {
  const [searchParams] = useSearchParams()
  const [openPicker, setOpenPicker] = useState<string | null>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!openPicker) {
      setPopoverPos(null)
      return
    }
    const btn = buttonRefs.current[openPicker]
    if (!btn) return
    function place() {
      const rect = btn!.getBoundingClientRect()
      setPopoverPos({ top: rect.bottom + 8, left: rect.left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [openPicker])

  useEffect(() => {
    if (!openPicker) return
    function onDocClick(e: MouseEvent) {
      const tgt = e.target as Node
      const btn = buttonRefs.current[openPicker!]
      if (popoverRef.current?.contains(tgt)) return
      if (btn?.contains(tgt)) return
      setOpenPicker(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenPicker(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [openPicker])

  const [values, setValues] = useState<FilterValues>(() => {
    const init: FilterValues = {}
    for (const f of filters) {
      if (f.type === 'date' || f.type === 'boolean' || f.type === 'text') {
        init[f.field] = searchParams.get(f.field) || ''
      } else {
        init[f.field] = {
          from: searchParams.get(`${f.field}From`) || '',
          to: searchParams.get(`${f.field}To`) || '',
        }
      }
    }
    return init
  })

  useEffect(() => {
    const init: FilterValues = {}
    for (const f of filters) {
      if (f.type === 'date' || f.type === 'boolean' || f.type === 'text') {
        init[f.field] = searchParams.get(f.field) || ''
      } else {
        init[f.field] = {
          from: searchParams.get(`${f.field}From`) || '',
          to: searchParams.get(`${f.field}To`) || '',
        }
      }
    }
    setValues(init)
  }, [searchParams, filters])

  useEffect(() => {
    onApply(localFilters)
  }, [])

  const handleChange = (field: string, part: 'from' | 'to' | 'single', value: string) => {
    setValues(prev => {
      const next = { ...prev }
      if (part === 'single') {
        next[field] = value
      } else {
        next[field] = { ...(prev[field] as { from: string; to: string }), [part]: value }
      }

      const params: Record<string, unknown> = {}
      for (const f of filters) {
        const v = next[f.field]
        if ((f.type === 'date' || f.type === 'boolean' || f.type === 'text') && typeof v === 'string' && v) {
          params[f.field] = v
        } else if (typeof v === 'object' && v.from && v.to) {
          params[`${f.field}From`] = v.from
          params[`${f.field}To`] = v.to
        }
      }
      onApply(params)

      return next
    })
  }

  const handleSingleDateChange = (field: string, value: string) => {
    handleChange(field, 'single', value)
  }

  const applyRange = (field: string, from: string, to: string) => {
    setValues(prev => {
      const next = { ...prev, [field]: { from, to } }
      const params: Record<string, unknown> = {}
      for (const f of filters) {
        const v = next[f.field]
        if ((f.type === 'date' || f.type === 'boolean' || f.type === 'text') && typeof v === 'string' && v) {
          params[f.field] = v
        } else if (typeof v === 'object' && v.from && v.to) {
          params[`${f.field}From`] = v.from
          params[`${f.field}To`] = v.to
        }
      }
      onApply(params)
      return next
    })
  }

  const hasActiveFilters = filters.some(f => {
    const v = values[f.field]
    if (f.type === 'date' || f.type === 'boolean' || f.type === 'text') {
      return typeof v === 'string' && v !== ''
    }
    return (v as { from: string; to: string }).from || (v as { from: string; to: string }).to
  })

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 border-b border-gray-100 bg-white">
      {filters.map(f => {
        if (f.type === 'date') {
          return (
            <div key={f.field} className="flex items-center gap-3">
              <span className="text-xs font-light text-gray-900 uppercase tracking-wide">{f.label ?? "Date"}:</span>
              <input
                type="date"
                value={typeof values[f.field] === 'string' ? values[f.field] as string : ''}
                onChange={(e) => handleSingleDateChange(f.field, e.target.value)}
                className="pl-3 py-2 text-sm bg-transparent focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          )
        }
        if (f.type === 'dateRange') {
          const cur = values[f.field] as { from: string; to: string }
          const presets = datePresets()
          const isOpen = openPicker === f.field
          const matchedPreset = presets.find(p => p.from === cur.from && p.to === cur.to)
          const hasRange = !!(cur.from && cur.to)
          return (
            <div key={f.field} className="flex items-center gap-3">
              <span className="text-xs font-light text-gray-900 uppercase tracking-wide">{f.label ?? "Date Range"}:</span>
              <button
                ref={(el) => { buttonRefs.current[f.field] = el }}
                type="button"
                onClick={() => setOpenPicker(isOpen ? null : f.field)}
                className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${isOpen ? 'text-gray-900 bg-gray-50' : 'hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {matchedPreset ? (
                  <span className="text-xs font-mono uppercase tracking-wide text-gray-900">{matchedPreset.label}</span>
                ) : hasRange ? (
                  <span className="flex items-center gap-2 text-xs font-mono text-gray-700 tabular-nums tracking-wide">
                    <span>{cur.from}</span>
                    <span className="text-gray-300">—</span>
                    <span>{cur.to}</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono uppercase tracking-wide text-gray-400">Sin rango</span>
                )}
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && popoverPos && createPortal(
                <div
                  ref={popoverRef}
                  className="fixed z-[1000] w-[640px] max-w-[90vw] p-4 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col gap-4"
                  style={{ top: popoverPos.top, left: popoverPos.left }}
                >
                  <div className="flex flex-wrap items-center gap-1">
                    {presets.map(p => {
                      const active = cur.from === p.from && cur.to === p.to
                      return (
                        <button
                          key={p.label}
                          onClick={() => {
                            applyRange(f.field, p.from, p.to)
                            setOpenPicker(null)
                          }}
                          className={`px-2 py-1 text-[10px] uppercase tracking-wide rounded-md transition-colors ${active ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                  <DateRangePicker
                    from={cur.from}
                    to={cur.to}
                    onChange={(from, to) => {
                      applyRange(f.field, from, to)
                      setOpenPicker(null)
                    }}
                  />
                </div>,
                document.body
              )}
            </div>
          )
        }
        if (f.type === 'text') {
          return (
            <div key={f.field} className="flex items-center gap-3">
              <span className="text-xs font-light text-gray-900 uppercase tracking-wide">{f.label ?? f.field}:</span>
              <input
                type="text"
                value={typeof values[f.field] === 'string' ? String(values[f.field]) : ''}
                onChange={(e) => handleSingleDateChange(f.field, e.target.value)}
                placeholder={f.data?.placeholder ?? ''}
                className="px-2 py-1 text-sm bg-transparent border-b border-gray-200 uppercase focus:outline-none focus:border-gray-500 w-40"
              />
            </div>
          )
        }
        if (f.type === 'boolean') {
          const isActive = typeof values[f.field] === 'string' ? values[f.field] : null
          const leftLabel = f.data?.['false'] ?? 'No'
          const rightLabel = f.data?.['true'] ?? 'Yes'
          return (
            <div key={f.field} className="flex items-center gap-3">
              <span className="text-xs font-light text-gray-900 uppercase tracking-wide">{f.label ?? f.field}:</span>
              <button
                onClick={() => {
                  if (isActive === null) handleSingleDateChange(f.field, 'true')
                  else if (isActive === 'true') handleSingleDateChange(f.field, '')
                  else handleSingleDateChange(f.field, 'true')
                }}
                className={`relative h-6 rounded-md ${isActive ? "bg-gray-800" : "bg-gray-200"} overflow-hidden 
                    px-4 active:scale-[0.90] transition-all ease-in-out`}
              >
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <span className={`text-[10px] uppercase font-medium leading-none transition-all duration-200 ${isActive === 'true' ? 'translate-y-2 text-gray-200' : '-translate-y-full text-gray-400'}`}>{rightLabel}</span>
                  <span className={`text-[10px] uppercase font-medium leading-none transition-all duration-200 ${isActive === 'true' ? 'translate-y-full text-gray-400' : '-translate-y-2 text-gray-900'}`}>{leftLabel}</span>
                </span>
              </button>
            </div>
          )
        }
        return null
      })}

      {showClear && hasActiveFilters && (
        <button
          onClick={() => {
            const cleared: FilterValues = {}
            for (const f of filters) {
              cleared[f.field] = (f.type === 'date' || f.type === 'boolean' || f.type === 'text') ? '' : { from: '', to: '' }
            }
            setValues(cleared)
            onClear()
          }}
          className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 rounded-lg uppercase tracking-wide transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  )
}