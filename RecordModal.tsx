import { useState, useEffect } from 'react'
import { createRecord, fieldLabel, fieldRelation, fieldType, listRecords, updateRecord, type ApiRecord, type EntityDef } from './data/provider'

interface Props {
  entity: EntityDef
  record?: ApiRecord
  onClose: () => void
  onSaved: () => void
}

function parseValue(raw: string, type: string): unknown {
  if (type === 'integer') return raw === '' ? null : parseInt(raw, 10)
  if (type === 'number') return raw === '' ? null : parseFloat(raw)
  if (type === 'boolean') return raw === 'true'
  if (type === 'array')
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  if (type === 'relation') return raw === '' ? null : raw
  return raw
}

function toFormValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return ''
  if (type === 'array' && Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function RecordModal({ entity, record, onClose, onSaved }: Props) {
  const isEditing = !!record
  const fields = entity.fields

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const [field, def] of Object.entries(fields)) {
      init[field] = record ? toFormValue(record[field], fieldType(def)) : ''
    }
    return init
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [relatedRecords, setRelatedRecords] = useState<Record<string, ApiRecord[]>>({})

  useEffect(() => {
    const load = async () => {
      const result: Record<string, ApiRecord[]> = {}
      for (const [, def] of Object.entries(fields)) {
        const rel = fieldRelation(def)
        if (rel && !(rel.entity in result)) {
          result[rel.entity] = await listRecords(rel.entity)
        }
      }
      setRelatedRecords(result)
    }
    load()
  }, [])

  const set = (field: string, val: string) =>
    setForm((f) => ({ ...f, [field]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const data: Record<string, unknown> = {}
      for (const [field, def] of Object.entries(fields)) {
        data[field] = parseValue(form[field], fieldType(def))
      }
      if (isEditing) {
        await updateRecord(entity.name, record!.id as string, data)
      } else {
        await createRecord(entity.name, data)
      }
      onSaved()
    } catch {
      setError('No se pudo guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="font-mono font-light text-xl text-gray-900">
              {isEditing ? `Editar ${entity.label ?? entity.name}` : `Nuevo ${entity.label ?? entity.name}`}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {isEditing ? 'Modifica los campos y guarda' : 'Completa los campos para agregar'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {Object.entries(fields).map(([field, def]) => {
            const type = fieldType(def)
            const label = fieldLabel(field, def)
            return (
              <div key={field}>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  {label}
                </label>

                {type === 'relation' ? (() => {
                  const rel = fieldRelation(def)!
                  const options = relatedRecords[rel.entity] ?? []
                  return (
                    <select
                      value={form[field]}
                      onChange={(e) => set(field, e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
                    >
                      <option value="">— Seleccionar —</option>
                      {options.map((r) => (
                        <option key={r.id as string} value={r.id as string}>
                          {String(r[rel.displayField] ?? r.id)}
                        </option>
                      ))}
                    </select>
                  )
                })() : type === 'boolean' ? (
                  <select
                    value={form[field]}
                    onChange={(e) => set(field, e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
                  >
                    <option value="">— Seleccionar —</option>
                    <option value="true">Verdadero</option>
                    <option value="false">Falso</option>
                  </select>
                ) : (
                  <input
                    type={type === 'integer' || type === 'number' ? 'number' : 'text'}
                    step={type === 'integer' ? 1 : type === 'number' ? 'any' : undefined}
                    placeholder={type === 'array' ? 'valor1, valor2, valor3' : `Escribe ${label.toLowerCase()}…`}
                    value={form[field]}
                    onChange={(e) => set(field, e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors"
                  />
                )}
              </div>
            )
          })}

          {error && (
            <div className="flex items-start gap-3 text-sm text-red-700 border border-red-200 rounded-lg px-4 py-3 bg-red-50">
              <span className="text-base leading-none mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
