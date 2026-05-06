import { forwardRef, useImperativeHandle, useState, type ReactNode } from 'react'

interface DualButtonState {
  label: string
  icon?: ReactNode
}

export interface DualButtonHandle {
  /** Fire activate logic (first click) and set active=true. */
  activate: () => void
  /** Fire confirm logic (second click) and set active=false. */
  confirm: () => void
  /** Force active state. Skips onActivate/onConfirm. */
  setActive: (v: boolean) => void
  /** Toggle: activate when inactive, confirm when active. */
  toggle: () => void
}

interface DualButtonProps {
  /** Optional controlled active state. When provided, parent owns state. */
  active?: boolean
  /** Initial state when uncontrolled. */
  defaultActive?: boolean
  /** Called on first click (when inactive). */
  onActivate?: () => void
  /** Called on second click (when active). */
  onConfirm?: () => void
  /** Notified when internal active state changes (uncontrolled mode). */
  onActiveChange?: (active: boolean) => void
  primary: DualButtonState
  secondary: DualButtonState
  primaryClass?: string
  secondaryClass?: string
  className?: string
  labelWidth?: string
  activeLabelWidth?: string
}

/**
 * Two-state animated button. First click → onActivate (and switches to
 * `secondary` view). Second click → onConfirm (and switches back).
 *
 * Can be controlled (`active` prop) or uncontrolled (internal state).
 * Parent can also drive transitions imperatively via ref:
 *
 *   const ref = useRef<DualButtonHandle>(null)
 *   ref.current?.activate()
 *   ref.current?.confirm()
 *   ref.current?.setActive(false)
 */
const DualButton = forwardRef<DualButtonHandle, DualButtonProps>(function DualButton(
  {
    active,
    defaultActive = false,
    onActivate,
    onConfirm,
    onActiveChange,
    primary,
    secondary,
    primaryClass = 'bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100',
    secondaryClass = 'bg-yellow-400 text-gray-900',
    className = '',
    labelWidth = '16',
    activeLabelWidth = '16'
  },
  ref,
) {
  const [internalActive, setInternalActive] = useState(defaultActive)
  const isControlled = active !== undefined
  const current = isControlled ? active! : internalActive

  const updateActive = (next: boolean) => {
    if (!isControlled) setInternalActive(next)
    onActiveChange?.(next)
  }

  const doActivate = () => {
    onActivate?.()
    updateActive(true)
  }

  const doConfirm = () => {
    onConfirm?.()
    updateActive(false)
  }

  useImperativeHandle(ref, () => ({
    activate: doActivate,
    confirm: doConfirm,
    setActive: (v: boolean) => updateActive(v),
    toggle: () => (current ? doConfirm() : doActivate()),
  }))

  return (
    <button
      onClick={() => (current ? doConfirm() : doActivate())}
      className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all ${current ? secondaryClass : primaryClass} ${className}`}
    >
      <div className={`relative overflow-hidden h-5 flex flex-row justify-center items-center`} style={{
        width: active ? activeLabelWidth + "px" : labelWidth + "px"
      }}>
        <span className={`absolute inset-0 uppercase transition-all duration-200 ${current ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
          {primary.label}
        </span>
        <span className={`absolute inset-0 uppercase transition-all duration-200 ${current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
          {secondary.label}
        </span>
      </div>
      {(primary.icon || secondary.icon) && (
        <div className="relative w-4 h-4">
          {primary.icon && (
            <span className={`absolute inset-0 w-4 h-4 transition-all duration-200 ${current ? 'opacity-0 rotate-12 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
              {primary.icon}
            </span>
          )}
          {secondary.icon && (
            <span className={`absolute inset-0 w-4 h-4 transition-all duration-200 ${current ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-12 scale-50'}`}>
              {secondary.icon}
            </span>
          )}
        </div>
      )}
    </button>
  )
})

export default DualButton
