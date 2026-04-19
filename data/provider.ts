const BASE = '/api'

export interface RelationDef {
  entity: string
  displayField: string
}

export interface FieldComponent {
  type: string
  [key: string]: unknown
}

export interface FieldDef {
  type: string
  label?: string
  align?: 'left' | 'center' | 'right'
  width?: number | 'fit' | 'full'
  relation?: RelationDef
  component?: string | FieldComponent
  allowSearch?: boolean
}

export interface FilterDef {
  type: 'boolean' | 'date' | 'dateRange' | 'text' | 'select' | 'numberRange'
  field: string
  label?: string
  data?: Record<string, string>
}

export interface EntityDef {
  name: string
  label?: string
  description?: string
  readonly?: boolean
  fields: Record<string, string | FieldDef>
  filters?: FilterDef[]
}

/** Internal key used when sending/receiving data from the API. */
export function fieldType(def: string | FieldDef): string {
  return typeof def === 'string' ? def : def.type
}

/** Human-readable label shown in the UI. Falls back to the field key. */
export function fieldLabel(key: string, def: string | FieldDef): string {
  return typeof def === 'string' ? key : (def.label ?? key)
}

/** Relation metadata for a field, if any. */
export function fieldRelation(def: string | FieldDef): RelationDef | undefined {
  return typeof def === 'string' ? undefined : def.relation
}

/** Alignment for the field column. Defaults to 'left'. */
export function fieldAlign(def: string | FieldDef): 'left' | 'center' | 'right' {
  return typeof def === 'string' ? 'left' : (def.align ?? 'left')
}

/** Width for the field column. Defaults to undefined (auto). */
export function fieldWidth(def: string | FieldDef): number | 'fit' | 'full' | undefined {
  return typeof def === 'string' ? undefined : def.width
}

/** Whether the field is searchable. Defaults to false. */
export function fieldAllowSearch(def: string | FieldDef): boolean {
  return typeof def === 'string' ? false : (def.allowSearch ?? false)
}

export interface ApiRecord {
  id: string
  [key: string]: unknown
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const getEntities = () => req<EntityDef[]>('/entities')

export function buildFilterParams(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, String(value))
    }
  }
  return params.toString()
}

export const listRecords = (entity: string, filterParams?: Record<string, unknown>) => {
  const query = filterParams ? buildFilterParams(filterParams) : ''
  const path = query ? `/${entity}?${query}` : `/${entity}`
  return req<ApiRecord[]>(path)
}

export const createRecord = (entity: string, data: Record<string, unknown>) =>
  req<ApiRecord>(`/${entity}`, { method: 'POST', body: JSON.stringify(data) })

export const updateRecord = (entity: string, id: string, data: Record<string, unknown>) =>
  req<ApiRecord>(`/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteRecord = (entity: string, id: string) =>
  req<void>(`/${entity}/${id}`, { method: 'DELETE' })
