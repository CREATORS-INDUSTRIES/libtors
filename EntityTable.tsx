import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { renderField } from './fieldRenderers'
import { fieldAlign, fieldLabel, fieldRelation, fieldType, fieldWidth, type ApiRecord, type EntityDef, type FieldDef } from './data/provider'

interface Props {
  entity: EntityDef
  records: ApiRecord[]
  relatedRecords: Record<string, ApiRecord[]>
  onEdit: (record: ApiRecord) => void
  onDelete: (record: ApiRecord) => void
  searchQuery?: string
  searchableFields?: string[]
  onRowClick?: (record: ApiRecord, openModal: (component?: ReactNode) => void, setRecordIdQuery: (recordId: string) => void) => void
}

interface ModalState {
  open: boolean
  content: ReactNode | null
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function getCellStyle(width: number | 'fit' | 'full' | undefined, hasFullColumns: boolean): React.CSSProperties | undefined {
  if (width === undefined) return undefined
  if (width === 'fit') return { width: 'min-content' }
  if (width === 'full') {
    const fullWidthPercent = Math.floor(100 / (hasFullColumns + 1))
    return { width: `${fullWidthPercent}%` }
  }
  return { width, maxWidth: width }
}

export default function EntityTable({ entity, records, relatedRecords, onEdit, onDelete, searchQuery, searchableFields = [], onRowClick }: Props) {
  const [modal, setModal] = useState<ModalState>({ open: false, content: null })
  const [searchParams, setSearchParams] = useSearchParams()
  const restoredRef = useRef<string | null>(null)

  const openModal = (component?: ReactNode) => {
    if (component) {
      setModal({ open: true, content: component })
    }
  }

  const closeModal = () => {
    setModal({ open: false, content: null })
    const p = new URLSearchParams(searchParams)
    if (p.has('selected')) {
      p.delete('selected')
      setSearchParams(p, { replace: true })
    }
    restoredRef.current = null
  }

  const setRecordIdQuery = (recordId: string) => {
    const p = new URLSearchParams(searchParams)
    p.set('selected', recordId)
    setSearchParams(p, { replace: true })
  }

  const handleRowClick = (record: ApiRecord) => {
    if (!onRowClick) return
    onRowClick(record, openModal, setRecordIdQuery)
  }

  useEffect(() => {
    const sel = searchParams.get('selected')
    if (!sel || !onRowClick || records.length === 0) return
    if (restoredRef.current === sel) return
    const record = records.find(r => String(r.id) === sel)
    if (!record) return
    restoredRef.current = sel
    onRowClick(record, openModal, setRecordIdQuery)
  }, [searchParams, records, onRowClick])

  const fieldNames = Object.keys(entity.fields)

  const fullColumns = fieldNames.filter(f => fieldWidth(entity.fields[f]) === 'full').length
  const hasFullColumns = fullColumns > 0
  const fullWidthPercent = hasFullColumns ? Math.floor(100 / (fullColumns + 1)) : 0

  function resolveCell(fieldKey: string, value: unknown): ReactNode {
    const def = entity.fields[fieldKey]

    if (fieldType(def) === 'relation') {
      const rel = fieldRelation(def)
      if (rel && typeof value === 'string') {
        const bucket = relatedRecords[rel.entity] ?? []
        const found = bucket.find((r) => r.id === value)
        const shownValue = found ? String(found[rel.displayField] ?? value) : value
        return renderField(
          (def as FieldDef).component,
          shownValue,
          formatValue(value)
        )
      }
    }
    return renderField((def as FieldDef).component, value, formatValue(value))
  }

  const fieldsWithMatches = searchQuery ? searchableFields.reduce((acc, field) => {
    acc[field] = records.some(record => {
      const value = record[field]
      if (value == null) return false
      return String(value).toLowerCase().includes(searchQuery.toLowerCase())
    })
    return acc
  }, {} as Record<string, boolean>) : {}

  return (
    <div className="overflow-auto h-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <table className="table-fixed min-w-full w-max">
        <thead className="sticky top-0 z-10 bg-gray-50" style={{
          boxShadow: "inset 0 -1px #ececec"
        }}>
          <tr>
            <th className="text-left px-4 py-4 text-sm text-gray-500 font-medium whitespace-nowrap" style={{ width: 60 }}>
              #
            </th>
            {fieldNames.map((f) => {
              const align = fieldAlign(entity.fields[f])
              const width = fieldWidth(entity.fields[f])
              const isMatching = fieldsWithMatches[f]
              return (
                <th
                  key={f}
                  className={`text-${align} px-4 py-4 text-sm font-light uppercase whitespace-nowrap ${isMatching ? 'text-yellow-700 bg-yellow-100 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.3)]' : 'text-gray-500'}`}
                  style={getCellStyle(width, hasFullColumns)}
                >
                  {fieldLabel(f, entity.fields[f])}
                </th>
              )
            })}
            <th className="whitespace-nowrap" style={{ width: 120 }} />
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr
              key={record.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => handleRowClick(record)}
            >
              <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap" style={{ width: 60 }}>
                {index + 1}
              </td>
              {fieldNames.map((f) => {
                const align = fieldAlign(entity.fields[f])
                const width = fieldWidth(entity.fields[f])
                return (
                  <td
                    key={f}
                    className={`px-4 py-4 text-sm text-gray-700 text-${align} whitespace-nowrap`}
                    style={getCellStyle(width, hasFullColumns)}
                  >
                    {resolveCell(f, record[f])}
                  </td>
                )
              })}
              <td className="px-4 py-4 whitespace-nowrap" style={{ width: 120 }}>
                <div className="flex items-center gap-2 justify-end">
                  {!entity.readonly && (
                    <>
                      <button
                        onClick={() => onEdit(record)}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(record)}
                        className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal.open && modal.content && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[85vh] overflow-auto animate-zoom-in-95" onClick={e => e.stopPropagation()}>
            {modal.content}
          </div>
        </div>
      )}
    </div>
  )
}
