import { useState, type ReactNode } from 'react'

export interface TabDef {
  key: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

type Variant = 'underline' | 'pills' | 'segmented' | 'minimal'

interface TabsProps {
  tabs: TabDef[]
  defaultKey?: string
  activeKey?: string
  onChange?: (key: string) => void
  variant?: Variant
  className?: string
  /** Optional content rendered on the right side of the tab bar (e.g. actions). */
  trailing?: ReactNode
}

/**
 * libtors-style tabs. Variants:
 * - 'underline' (default): sharp gray-900 underline on active
 * - 'pills': sidebar PageLink style, gray-100 bg + outline on active
 * - 'segmented': bordered group, active inverted bg-gray-900 text-white
 * - 'minimal': uppercase text-only with separator dot
 */
export default function Tabs({
  tabs,
  defaultKey,
  activeKey,
  onChange,
  variant = 'underline',
  className = '',
  trailing,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultKey ?? tabs[0]?.key ?? '')
  const current = activeKey ?? internal
  const active = tabs.find(t => t.key === current) ?? tabs[0]

  const handleClick = (key: string) => {
    if (activeKey === undefined) setInternal(key)
    onChange?.(key)
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {variant === 'underline' && (
        <div className="flex items-stretch border-b border-gray-200 bg-white">
          {tabs.map(t => {
            const isActive = t.key === current
            return (
              <button
                key={t.key}
                onClick={() => handleClick(t.key)}
                className={`relative flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wide transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.icon && <span className="shrink-0">{t.icon}</span>}
                <span>{t.label}</span>
                <span className={`absolute left-0 right-0 bottom-[-1px] h-px ${isActive ? 'bg-gray-900' : 'bg-transparent'}`} />
              </button>
            )
          })}
          <div className="flex-1" />
          {trailing && <div className="flex items-center px-4">{trailing}</div>}
        </div>
      )}

      {variant === 'pills' && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-1">
            {tabs.map(t => {
              const isActive = t.key === current
              return (
                <button
                  key={t.key}
                  onClick={() => handleClick(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wide transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 outline outline-1 outline-gray-200'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {t.icon && <span className="shrink-0">{t.icon}</span>}
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
          {trailing}
        </div>
      )}

      {variant === 'segmented' && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <div className="inline-flex items-stretch border border-gray-200 rounded-lg overflow-hidden">
            {tabs.map((t, i) => {
              const isActive = t.key === current
              return (
                <button
                  key={t.key}
                  onClick={() => handleClick(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wide transition-colors ${
                    i > 0 ? 'border-l border-gray-200' : ''
                  } ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {t.icon && <span className="shrink-0">{t.icon}</span>}
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
          {trailing}
        </div>
      )}

      {variant === 'minimal' && (
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            {tabs.map((t, i) => {
              const isActive = t.key === current
              return (
                <div key={t.key} className="flex items-center gap-3">
                  {i > 0 && <span className="text-gray-300">·</span>}
                  <button
                    onClick={() => handleClick(t.key)}
                    className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest transition-colors ${
                      isActive ? 'text-gray-900' : 'text-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {t.icon && <span className="shrink-0">{t.icon}</span>}
                    <span>{t.label}</span>
                  </button>
                </div>
              )
            })}
          </div>
          {trailing}
        </div>
      )}

      <div className="flex-1 min-h-0">
        {active?.content}
      </div>
    </div>
  )
}
