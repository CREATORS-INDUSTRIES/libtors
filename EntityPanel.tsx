import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import RecordModal from './RecordModal'
import DeleteModal from './DeleteModal'
import ProgressBar from './ProgressBar'
import EntityTable from './EntityTable'
import EntityFilters from './EntityFilters'
import DualButton from './DualButton'
import { fieldAllowSearch, fieldLabel, fieldRelation, listRecords, type ApiRecord, type EntityDef } from './data/provider'
import { hasActiveFilter, getActiveFilterLabel, clearFilterKeys } from './filterUtils'

export interface HeaderActionsContext {
  filteredRecords: ApiRecord[]
  activeFilterLabels: string[]
}

interface Props {
  entity: EntityDef
  onRowClick?: (record: ApiRecord, openModal: (content?: ReactNode) => void, setRecordIdQuery: (recordId: string) => void) => void
  headerActions?: (ctx: HeaderActionsContext) => ReactNode
}

export default function EntityPanel({ entity, onRowClick, headerActions }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [relatedRecords, setRelatedRecords] = useState<Record<string, ApiRecord[]>>({})
  const [loading, setLoading] = useState(false)
  const [fetchDone, setFetchDone] = useState(false)
  const [barComplete, setBarComplete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiRecord | null>(null)
  const [modal, setModal] = useState<{ open: boolean; record?: ApiRecord }>({ open: false })
  const [showFilters, setShowFilters] = useState(() => (entity.filters?.length ?? 0) > 0)
  const [searchQuery, setSearchQuery] = useState('')
  const [localFilters, setLocalFilters] = useState<Record<string, unknown>>({})
  const filterKey = useMemo(() => {
    const parts: string[] = []
    for (const [key, value] of searchParams.entries()) {
      if (key === 'selected') continue
      parts.push(`${key}=${value}`)
    }
    return parts.sort().join('&')
  }, [searchParams])

  const filterParams = useMemo(() => {
    const params: Record<string, unknown> = {}
    for (const [key, value] of new URLSearchParams(filterKey).entries()) {
      params[key] = value
    }
    return params
  }, [filterKey])


  const handleFilterChange = (params: Record<string, unknown>) => {
    setLocalFilters(params)
  }

  const applyFiltersAndClose = () => {
    const newParams = new URLSearchParams(searchParams)
    const filterKeys = entity.filters?.flatMap(clearFilterKeys) ?? []
    for (const key of filterKeys) {
      newParams.delete(key)
    }
    for (const [key, value] of Object.entries(localFilters)) {
      if (value) newParams.set(key, String(value))
    }
    setSearchParams(newParams)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setLocalFilters({})
    const newParams = new URLSearchParams(searchParams)
    const filterKeys = entity.filters?.flatMap(clearFilterKeys) ?? []
    for (const key of filterKeys) {
      newParams.delete(key)
    }
    setSearchParams(newParams)
  }

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setFetchDone(false)
    setBarComplete(false)
    try {
      const [own, related] = await Promise.all([
        listRecords(entity.name, filterParams),
        (async () => {
          const result: Record<string, ApiRecord[]> = {}
          for (const [, def] of Object.entries(entity.fields)) {
            const rel = fieldRelation(def)
            if (rel && !(rel.entity in result)) {
              result[rel.entity] = await listRecords(rel.entity)
            }
          }
          return result
        })(),
      ])
      setRecords(own)
      setRelatedRecords(related)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setFetchDone(true)
    }
  }, [entity.name, entity.fields, filterParams])

  useEffect(() => {
    setRecords([])
    setDeleteTarget(null)
    setBarComplete(false)
    fetchRecords()
  }, [fetchRecords])

  const hasActiveFilters = entity.filters?.some(f => hasActiveFilter(f, searchParams))

  const activeFilterLabels = entity.filters?.map(f => getActiveFilterLabel(f, searchParams)).filter(Boolean)

  const searchableFields = Object.entries(entity.fields)
    .filter(([, def]) => fieldAllowSearch(def))
    .map(([key, def]) => ({ key, label: fieldLabel(key, def) }))
  const hasSearchableFields = searchableFields.length > 0
  const searchablePlaceholder = searchableFields.map(f => f.label).join(', ')
  const totalDigits = String(records.length).length
  const filteredRecords = hasSearchableFields && searchQuery.trim()
    ? records.filter(record =>
      searchableFields.some(({ key }) => {
        const value = record[key]
        if (value == null) return false
        return String(value).toLowerCase().includes(searchQuery.toLowerCase().trim())
      })
    )
    : records
  const paddedTotal = String(records.length).padStart(totalDigits, '0')
  const paddedFiltered = String(filteredRecords.length).padStart(totalDigits, '0')

  const PAGE_SIZE = 250
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-between px-8 py-5 border-b border-gray-200 shrink-0 bg-white gap-5">
        <div className="flex items-center gap-6 w-fit">
          <h1 className="font-mono font-normal uppercase text-2xl text-gray-900 w-fit">{entity.label ?? entity.name} </h1>
          <span className="text-md font-light font-mono uppercase text-2xl text-gray-400 min-w-fit">
            <span className="min-w-[1.5ch] text-right">{paddedFiltered}</span><span className="text-gray-300">/</span><span className="min-w-[1.5ch]">{paddedTotal}</span>
          </span>
        </div>
        <div className='flex w-full items-center'>
          {hasSearchableFields && (
            <div className="w-full flex items-center gap-2 px-3 py-2 bg-transparent border border-gray-200 hover:border-gray-500 rounded-lg transition-colors focus-within:border-gray-500 focus-within:bg-gray-100">
              <svg
                className="w-4 h-4 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchablePlaceholder || 'Buscar'}
                className="w-full uppercase text-sm text-gray-700 bg-transparent focus:outline-none placeholder:text-gray-400"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {entity.filters && entity.filters.length > 0 && (
            <DualButton
              active={showFilters}
              onActivate={() => setShowFilters(true)}
              onConfirm={applyFiltersAndClose}
              primary={{
                label: 'Filtros',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ),
              }}
              labelWidth="60"
              activeLabelWidth="60"
              secondary={{
                label: 'Aplicar',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ),
              }}
            />
          )}
          {headerActions?.({ filteredRecords, activeFilterLabels: activeFilterLabels ?? [] })}
          {!entity.readonly && (
            <button
              onClick={() => setModal({ open: true })}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 active:bg-gray-900 transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              Nuevo registro
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {entity.filters && entity.filters.length > 0 && showFilters && (
        <EntityFilters
          filters={entity.filters}
          onApply={handleFilterChange}
          onClear={clearFilters}
          showClear={false}
          localFilters={localFilters}
        />
      )}

      {/* Active Filters Banner */}
      {hasActiveFilters && activeFilterLabels && activeFilterLabels.length > 0 && (
        <div className="px-6 py-2 bg-yellow-400 text-gray-900 text-xs flex flex-row items-center justify-between gap-2 border border-yellow-500">
          <div className=''></div>
          <span className=''>{activeFilterLabels.join(' / ')}</span>
          <button
            onClick={clearFilters}
            className="text-gray-700 hover:text-gray-900 uppercase hover:underline "
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto bg-white">
        {(loading || !barComplete) ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 uppercase">
            <p>Cargando registros</p>
            <ProgressBar done={fetchDone} onComplete={() => setBarComplete(true)} />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl text-gray-300">○</span>
            </div>
            <div className="text-center">
              <p className="text-gray-600 font-medium text-base">Sin registros todavía</p>
              <p className="text-gray-400 text-sm mt-1">Crea el primero con el botón de arriba</p>
            </div>
          </div>
        ) : (
          <EntityTable
            entity={entity}
            records={pageRecords}
            relatedRecords={relatedRecords}
            onEdit={(record) => setModal({ open: true, record })}
            onDelete={(record) => setDeleteTarget(record)}
            searchQuery={searchQuery.trim()}
            searchableFields={searchableFields.map(f => f.key)}
            onRowClick={onRowClick}
          />
        )}
      </div>

      {/* Pagination */}
      {!loading && barComplete && totalPages > 1 && (
        <div className="shrink-0 border-t border-gray-100 px-8 py-3 flex items-center justify-between bg-white">
          <span className="text-xs font-mono text-gray-400 uppercase">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRecords.length)} de {filteredRecords.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1 text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            <span className="px-3 py-1 text-xs font-mono text-gray-500">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1 text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}

      {modal.open && (
        <RecordModal
          entity={entity}
          record={modal.record}
          onClose={() => setModal({ open: false })}
          onSaved={() => {
            setModal({ open: false })
            fetchRecords()
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          entity={entity}
          record={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null)
            fetchRecords()
          }}
        />
      )}
    </div>
  )
}