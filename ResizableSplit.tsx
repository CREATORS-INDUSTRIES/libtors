import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ResizableSplitProps {
  left: ReactNode
  right: ReactNode
  initialPct?: number
  minPct?: number
  maxPct?: number
  leftMinWidth?: number | string
  rightMinWidth?: number | string
  className?: string
}

export default function ResizableSplit({
  left,
  right,
  initialPct = 33.33,
  minPct = 15,
  maxPct = 85,
  leftMinWidth,
  rightMinWidth,
  className = '',
}: ResizableSplitProps) {
  const [leftPct, setLeftPct] = useState(initialPct)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.max(minPct, Math.min(maxPct, pct)))
    }
    function onUp() {
      if (!draggingRef.current) return
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [minPct, maxPct])

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div ref={containerRef} className={`w-full h-full flex flex-row ${className}`}>
      <div
        className="overflow-auto"
        style={{ width: `${leftPct}%`, minWidth: leftMinWidth }}
      >
        {left}
      </div>
      <div
        onMouseDown={startDrag}
        onDoubleClick={() => setLeftPct(initialPct)}
        className="w-[2px] shrink-0 bg-gray-200 hover:bg-gray-400 active:bg-gray-500 cursor-col-resize transition-colors"
      />
      <div
        className="flex-1 min-w-0 overflow-auto"
        style={{ minWidth: rightMinWidth }}
      >
        {right}
      </div>
    </div>
  )
}
