import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FilterDef } from './data/provider'

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

export default function EntityFilters({ filters, onApply, onClear, showClear, localFilters }: Props) {
  const [searchParams] = useSearchParams()

  const [values, setValues] = useState<FilterValues>(() => {
    const init: FilterValues = {}
    for (const f of filters) {
      if (f.type === 'date' || f.type === 'boolean') {
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
      if (f.type === 'date' || f.type === 'boolean') {
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
        if (f.type === 'date' && typeof v === 'string' && v) {
          params[f.field] = v
        } else if (f.type === 'boolean' && typeof v === 'string' && v) {
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

  const hasActiveFilters = filters.some(f => {
    const v = values[f.field]
    if (f.type === 'date' || f.type === 'boolean') {
      return typeof v === 'string' && v !== ''
    }
    return (v as { from: string; to: string }).from || (v as { from: string; to: string }).to
  })

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white">
      {filters.map(f => {
        if (f.type === 'date') {
          return (
            <div key={f.field} className="flex items-center gap-3">
              <span className="text-xs font-light text-gray-400 uppercase tracking-wide">{f.label ?? "Date"}:</span>
              <input
                type="date"
                value={typeof values[f.field] === 'string' ? values[f.field] : ''}
                onChange={(e) => handleSingleDateChange(f.field, e.target.value)}
                className="pl-3 py-2 text-sm bg-transparent focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          )
        }
        if (f.type === 'dateRange') {
          return (
            <div key={f.field} className="flex items-center gap-3">
              <span className="text-xs font-light text-gray-400 uppercase tracking-wide">{f.label ?? "Date Range"}:</span>
              <div className="flex items-center overflow-hidden">
                <input
                  type="date"
                  value={(values[f.field] as { from: string; to: string }).from}
                  onChange={(e) => handleChange(f.field, 'from', e.target.value)}
                  className="pl-3 py-2 text-sm bg-transparent focus:outline-none w-fit [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <span className="text-gray-300">—</span>
                <input
                  type="date"
                  value={(values[f.field] as { from: string; to: string }).to}
                  onChange={(e) => handleChange(f.field, 'to', e.target.value)}
                  className="pl-3 py-2 text-sm bg-transparent focus:outline-none min-w-[120px] [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
            </div>
          )
        }
        if (f.type === 'boolean') {
          const isActive = typeof values[f.field] === 'string' ? values[f.field] : null
          const leftLabel = f.data?.['false'] ?? 'No'
          const rightLabel = f.data?.['true'] ?? 'Yes'
          return (
            <div key={f.field} className="flex items-center gap-3">
              <span className="text-xs font-light text-gray-400 uppercase tracking-wide">{f.label ?? f.field}:</span>
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
              cleared[f.field] = (f.type === 'date' || f.type === 'boolean') ? '' : { from: '', to: '' }
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