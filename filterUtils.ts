import type { FilterDef } from './data/provider'

export interface FilterParams {
  type: 'date' | 'dateRange' | 'boolean' | 'text' | 'select' | 'numberRange'
  field: string
  value?: string
  from?: string
  to?: string
}

export function getFilterParams(f: FilterDef, searchParams: URLSearchParams): FilterParams {
  switch (f.type) {
    case 'date':
      return { type: 'date', field: f.field, value: searchParams.get(f.field) ?? undefined }
    case 'dateRange':
      return {
        type: 'dateRange',
        field: f.field,
        from: searchParams.get(`${f.field}From`) ?? undefined,
        to: searchParams.get(`${f.field}To`) ?? undefined,
      }
    case 'boolean':
      return {
        type: 'boolean',
        field: f.field,
        value: searchParams.get(f.field) ?? undefined,
      }
    default:
      return { type: f.type, field: f.field, value: searchParams.get(f.field) ?? undefined }
  }
}

export function hasActiveFilter(f: FilterDef, searchParams: URLSearchParams): boolean {
  const params = getFilterParams(f, searchParams)
  if (params.type === 'dateRange') {
    return !!(params.from && params.to)
  }
  return params.value !== undefined && params.value !== ''
}

export function getActiveFilterLabel(f: FilterDef, searchParams: URLSearchParams): string | null {
  const params = getFilterParams(f, searchParams)
  if (params.type === 'dateRange') {
    if (params.from && params.to) {
      return `Desde ${params.from} hasta ${params.to}`
    }
    return null
  }
  if (!params.value) return null
  if (params.type === "date") {
    return getFilterLabel(f) + " " + params.value
  }
  if (params.type === "text") {
    return getFilterLabel(f) + " [" + params.value + "*]"
  }
  if (params.type === 'boolean') {
    if (params.value === 'true') return `${getFilterLabel(f)}: ${f.data?.['true'] ?? 'Sí'}`
    if (params.value === 'false') return `${getFilterLabel(f)}: ${f.data?.['false'] ?? 'No'}`
    return null
  }
  if (params.value) {
    return params.value
  }
  return null
}

export function clearFilterKeys(f: FilterDef): string[] {
  if (f.type === 'dateRange') {
    return [`${f.field}From`, `${f.field}To`]
  }
  return [f.field]
}

export function getFilterLabel(f: FilterDef): string {
  return f.label ?? f.field
}
