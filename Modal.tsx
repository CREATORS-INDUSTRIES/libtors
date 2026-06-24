import { createPortal } from 'react-dom'
import { type ReactNode } from 'react'

interface ModalProps {
  title?: ReactNode
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ title, open, onClose, children, className = '' }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 md:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal-box bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-black/[0.06] ${className}`}>
        {title !== undefined && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] flex-shrink-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/50">{title}</div>
            <button onClick={onClose} aria-label="Close" className="-mr-1 p-1 text-black/30 hover:text-black/70 transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
