import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ChevronIcon from './icons/ChevronIcon'
import CheckIcon from './icons/CheckIcon'

export type SelectOption<T> = { value: T; label: string }

interface SelectProps<T> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

// Compact single-select dropdown. The menu renders in a portal + fixed
// positioning so it never clips inside a scrolling table or card.
export default function Select<T extends string | number | boolean>({
  value,
  options,
  onChange,
  disabled = false,
  className = '',
  ariaLabel,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false)
    }
    function onLeave() {
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onLeave, true)
    window.addEventListener('resize', onLeave)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onLeave, true)
      window.removeEventListener('resize', onLeave)
    }
  }, [open])

  function toggle() {
    if (disabled) return
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 rounded-md border border-black/15 px-2.5 h-7 text-xs text-black/75 hover:bg-black/[0.03] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        <span className="truncate">{current?.label ?? ''}</span>
        <ChevronIcon className={`h-3 w-3 shrink-0 text-black/40 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="menu-in fixed z-50 rounded-md border border-black/[0.08] bg-white shadow-lg p-1"
            style={{ top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
          >
            {options.map((o) => {
              const selected = o.value === value
              return (
                <button
                  key={String(o.value)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-black/[0.04] ${
                    selected ? 'text-black' : 'text-black/60'
                  }`}
                >
                  {o.label}
                  {selected && <CheckIcon className="ml-auto h-3 w-3 text-black/60" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
