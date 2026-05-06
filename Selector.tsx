import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface SelectorOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  description?: string
  disabled?: boolean
}

interface SelectorProps<T extends string = string> {
  options: SelectorOption<T>[]
  value: T | null
  onChange: (value: T) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  /** Width of dropdown panel. Defaults to trigger width. */
  panelWidth?: number | string
  /** Align dropdown panel. */
  align?: 'left' | 'right'
  /** Open direction: down (below) or up (above). */
  direction?: 'down' | 'up'
}

/**
 * libtors-style dropdown selector. Matches search-input visual language:
 * border-gray-200, hover/focus border-gray-500, rounded-lg, font-mono
 * uppercase tracking-wide, animated chevron + opening popover.
 */
export default function Selector<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  label,
  disabled = false,
  className = '',
  panelWidth,
  align = 'left',
  direction = 'down',
}: SelectorProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value) ?? null

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative inline-flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-mono font-light text-gray-400 uppercase tracking-wide shrink-0">
          {label}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`flex items-center justify-between gap-2 px-3 py-2 bg-transparent border border-gray-200 rounded-lg transition-colors min-w-[160px] ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : open
              ? 'border-gray-500 bg-gray-100'
              : 'hover:border-gray-500'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected?.icon && <span className="shrink-0 text-gray-500">{selected.icon}</span>}
          <span
            className={`uppercase text-sm font-mono truncate ${
              selected ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-50 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${
            direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ width: panelWidth ?? '100%', minWidth: '160px' }}
        >
          <ul className="max-h-72 overflow-auto py-1">
            {options.length === 0 && (
              <li className="px-3 py-2 text-xs font-mono text-gray-400 uppercase">
                Sin opciones
              </li>
            )}
            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 transition-colors ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.icon && <span className="shrink-0 text-gray-500">{opt.icon}</span>}
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="uppercase text-sm font-mono truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[10px] font-mono text-gray-400 uppercase truncate">
                          {opt.description}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-gray-900 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
