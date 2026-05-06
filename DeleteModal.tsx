import { useState } from 'react'
import { deleteRecord, fieldLabel, type ApiRecord, type EntityDef } from './data/provider'

interface Props {
  entity: EntityDef
  record: ApiRecord
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteModal({ entity, record, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)

  // Pick the first string-like field value to identify the record for the user.
  const fieldNames = Object.keys(entity.fields)
  const previewField = fieldNames[0]
  const previewLabel = previewField ? fieldLabel(previewField, entity.fields[previewField]) : null
  const previewValue = previewField ? String(record[previewField] ?? '') : ''

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await deleteRecord(entity.name, record.id as string)
      onDeleted()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-200">
        {/* Icon + heading */}
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠</span>
          </div>
          <h2 className="font-mono font-light text-xl text-gray-900 mb-1">
            ¿Eliminar registro?
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Esta acción no se puede deshacer.
          </p>

          {previewLabel && previewValue && (
            <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-left">
              <p className="text-xs text-gray-400 mb-0.5">{previewLabel}</p>
              <p className="text-sm text-gray-800 font-medium truncate">{previewValue}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="w-full py-3 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
          <button
            onClick={onClose}
            disabled={deleting}
            className="w-full py-3 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
