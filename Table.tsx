import { useMemo, useState, type ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: number | string
  sortable?: boolean
  render?: (row: T) => ReactNode
  accessor?: (row: T) => string | number | null | undefined
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
  /** Extra classes for a row, decided per row (e.g. highlight a kind of row). */
  rowClassName?: (row: T) => string
  minWidth?: number | string
  footer?: React.ReactNode
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

export default function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'Sin registros',
  onRowClick,
  className = '',
  rowClassName,
  minWidth,
  footer,
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState>(null)

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col) return rows
    const accessor = col.accessor
    if (!accessor) return rows
    const sorted = [...rows].sort((a, b) => {
      const va = accessor(a)
      const vb = accessor(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return va - vb
      return String(va).localeCompare(String(vb), 'es', { numeric: true })
    })
    return sort.dir === 'desc' ? sorted.reverse() : sorted
  }, [rows, sort, columns])

  function toggleSort(key: string) {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const gridCols = columns
    .map(c => (typeof c.width === 'number' ? `${c.width}px` : c.width ?? 'minmax(0,1fr)'))
    .join(' ')

  function alignClass(a: TableColumn<T>['align']) {
    if (a === 'right') return 'text-right justify-end'
    if (a === 'center') return 'text-center justify-center'
    return 'text-left justify-start'
  }

  const innerStyle: React.CSSProperties = {}
  if (minWidth !== undefined) {
    innerStyle.minWidth = typeof minWidth === 'number' ? `${minWidth}px` : minWidth
  }

  return (
    <div className={`w-full h-full overflow-auto ${className}`}>
      <div style={innerStyle}>
        {/* Header — sticky vertical, scrolls horizontal with body */}
        <div
          className="grid items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10"
          style={{ gridTemplateColumns: gridCols }}
        >
          {columns.map(col => {
            const active = sort?.key === col.key
            const canSort = col.sortable !== false && !!col.accessor
            return (
              <button
                key={col.key}
                onClick={() => canSort && toggleSort(col.key)}
                disabled={!canSort}
                className={`group flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest transition-colors ${alignClass(col.align)} ${canSort ? 'cursor-pointer' : 'cursor-default'} ${active ? "text-black" : "text-gray-400"}`}
              >
                <span className="truncate">{col.label}</span>
                {canSort && (
                  <span
                    className={`text-sm font-extralight transition-all group-hover:text-black/60 text-black group-hover:opacity-100 ${active ? "opacity-100" : "opacity-0"} `}
                  >
                    {active && sort?.dir === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Rows */}
        {sortedRows.length === 0 ? (
          <div className="px-4 py-6 text-xs text-gray-400 font-mono uppercase">{emptyMessage}</div>
        ) : (
          sortedRows.map(row => (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`grid items-baseline gap-3 px-4 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(row) : ''}`}
              style={{ gridTemplateColumns: gridCols }}
            >
              {columns.map(col => (
                <div key={col.key} className={`flex items-baseline min-w-0 ${alignClass(col.align)}`}>
                  {/* No ellipsis, ever: text wraps within its column; when the
                      table floor (minWidth) is hit the container scrolls. */}
                  <div className={`text-sm font-mono text-gray-700 break-words min-w-0 ${col.align === 'right' ? 'tabular-nums' : ''}`}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        {footer && footer}
      </div>
    </div>
  )
}
