import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

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
  /** When true, clicking outside the button resets active → false. */
  dismissOnOutsideClick?: boolean
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
    labelWidth,
    activeLabelWidth,
    dismissOnOutsideClick = false,
  },
  ref,
) {
  const [internalActive, setInternalActive] = useState(defaultActive)
  const isControlled = active !== undefined
  const current = isControlled ? active! : internalActive
  const btnRef = useRef<HTMLButtonElement>(null)

  const updateActive = (next: boolean) => {
    if (!isControlled) setInternalActive(next)
    onActiveChange?.(next)
  }

  useEffect(() => {
    if (!dismissOnOutsideClick || !current) return
    function onDocClick(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        updateActive(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [dismissOnOutsideClick, current])

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
      ref={btnRef}
      onClick={() => (current ? doConfirm() : doActivate())}
      className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all ${current ? secondaryClass : primaryClass} ${className}`}
    >
      <DualLabel
        primary={primary.label}
        secondary={secondary.label}
        current={current}
        labelWidth={labelWidth}
        activeLabelWidth={activeLabelWidth}
      />
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

function DualLabel({
  primary,
  secondary,
  current,
  labelWidth,
  activeLabelWidth,
}: {
  primary: string
  secondary: string
  current: boolean
  labelWidth?: string
  activeLabelWidth?: string
}) {
  const autoSize = labelWidth === undefined && activeLabelWidth === undefined
  const primaryRef = useRef<HTMLSpanElement>(null)
  const secondaryRef = useRef<HTMLSpanElement>(null)
  const [primaryW, setPrimaryW] = useState<number | null>(null)
  const [secondaryW, setSecondaryW] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!autoSize) return
    if (primaryRef.current) setPrimaryW(primaryRef.current.offsetWidth)
    if (secondaryRef.current) setSecondaryW(secondaryRef.current.offsetWidth)
  }, [autoSize, primary, secondary])

  let width: string | undefined
  if (autoSize) {
    const target = current ? secondaryW : primaryW
    if (target != null) width = target + 'px'
  } else {
    width = (current ? (activeLabelWidth ?? labelWidth) : (labelWidth ?? activeLabelWidth)) + 'px'
  }

  return (
    <div
      className="relative overflow-hidden h-5 flex flex-row justify-center items-center transition-[width] duration-200 ease-out"
      style={width ? { width } : undefined}
    >
      {/* hidden measurers — only on auto-size */}
      {autoSize && (
        <>
          <span ref={primaryRef} className="absolute opacity-0 pointer-events-none uppercase whitespace-nowrap" aria-hidden>
            {primary}
          </span>
          <span ref={secondaryRef} className="absolute opacity-0 pointer-events-none uppercase whitespace-nowrap" aria-hidden>
            {secondary}
          </span>
        </>
      )}
      <span
        className={`absolute inset-0 flex items-center justify-center uppercase whitespace-nowrap transition-all duration-200 ${
          current ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
        }`}
      >
        {primary}
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center uppercase whitespace-nowrap transition-all duration-200 ${
          current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
        }`}
      >
        {secondary}
      </span>
    </div>
  )
}

export default DualButton
