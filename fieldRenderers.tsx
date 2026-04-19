import type { ReactNode } from 'react'

export interface FieldComponentSettings {
  type: string
  [key: string]: unknown
}

export type FieldRenderer = (value: unknown, settings?: Record<string, unknown>) => ReactNode

export const fieldRenderers: Record<string, FieldRenderer> = {
  badge: (value) => (
    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-mono">
      {String(value)}
    </span>
  ),
  link: (value) =>
    typeof value === 'string' ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        {value}
      </a>
    ) : null,
  money: (value, settings) =>
    typeof value === 'number' ? (
      <span className="font-mono text-right block w-full">{value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {settings?.currency ? String(settings.currency) : '$'}</span>
    ) : null,
  color: (value) =>
    typeof value === 'string' ? (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: value }} />
        <span className="font-mono text-xs">{value}</span>
      </div>
    ) : null,
}

export function renderField(
  component: string | FieldComponentSettings | undefined,
  value: unknown,
  fallback: ReactNode
): ReactNode {
  if (!component) return fallback

  let type: string
  let settings: Record<string, unknown> | undefined

  if (typeof component === 'string') {
    type = component
  } else {
    type = component.type
    settings = component
  }

  const renderer = fieldRenderers[type]
  if (!renderer) return fallback
  return renderer(value, settings)
}
