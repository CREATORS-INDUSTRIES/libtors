import { useState, type ReactNode } from 'react'

export interface AccordionItem {
  key: string
  label: ReactNode
  content: ReactNode
  action?: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  defaultOpenKey?: string
  openKey?: string
  onChange?: (key: string | null) => void
  className?: string
}

export default function Accordion({
  items,
  defaultOpenKey,
  openKey,
  onChange,
  className = '',
}: AccordionProps) {
  const [internal, setInternal] = useState<string | null>(defaultOpenKey ?? null)
  const current = openKey !== undefined ? openKey : internal

  function toggle(key: string) {
    const next = current === key ? null : key
    if (openKey === undefined) setInternal(next)
    onChange?.(next)
  }

  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {items.map((item, i) => {
        const isOpen = current === item.key
        const isLast = i === items.length - 1
        return (
          <div key={item.key} className={!isLast ? 'border-b border-gray-200' : ''}>
            <div className="flex items-center hover:bg-gray-50 transition-colors">
              <button
                onClick={() => toggle(item.key)}
                className="flex-1 flex items-center justify-between px-4 py-3 text-sm text-gray-800 cursor-pointer text-left"
              >
                <span>{item.label}</span>
              </button>
              {item.action && (
                <div className="px-3 flex items-center" onClick={(e) => e.stopPropagation()}>
                  {item.action}
                </div>
              )}
            </div>
            <div
              className="grid transition-all duration-200 ease-in-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 text-sm text-gray-600">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
