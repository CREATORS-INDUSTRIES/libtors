import { useId, useState } from 'react'

type InputTheme = 'light' | 'dark'

interface InputProps {
  label?: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  disabled?: boolean
  theme?: InputTheme
  className?: string
}

const THEMES: Record<InputTheme, { label: string; input: string; iconBtn: string }> = {
  light: {
    label: 'text-black/80',
    input:
      'text-black bg-white border-black/10 placeholder:text-black/30 hover:border-black/25 focus:border-black focus:ring-black/[0.06] focus:bg-white shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]',
    iconBtn: 'text-black/40 hover:text-black/80',
  },
  dark: {
    label: 'text-white/80',
    input:
      'text-white bg-white/[0.04] border-white/10 placeholder:text-white/25 hover:border-white/20 hover:bg-white/[0.06] focus:border-white focus:ring-white/[0.08] focus:bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
    iconBtn: 'text-white/40 hover:text-white/80',
  },
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2l20 20" />
      <path d="M6.7 6.7C4 8.7 2 12 2 12s3.5 7 10 7c2 0 3.7-.5 5.2-1.3" />
      <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  disabled,
  theme = 'light',
  className = '',
}: InputProps) {
  const id = useId()
  const t = THEMES[theme]
  const isPassword = type === 'password'
  const [show, setShow] = useState(false)
  const inputType = isPassword && show ? 'text' : type

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className={`text-sm font-medium ${t.label}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all duration-200 focus:ring-4 disabled:opacity-50 ${t.input} ${isPassword ? 'pr-11' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
            className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${t.iconBtn}`}
          >
            <EyeIcon open={!show} />
          </button>
        )}
      </div>
    </div>
  )
}
