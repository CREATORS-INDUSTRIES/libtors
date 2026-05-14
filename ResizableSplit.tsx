import { useEffect, useRef, useState, type ReactNode } from 'react'
import React from 'react'

interface ResizableSplitProps {
  children: ReactNode | ReactNode[]
  initialPcts?: number[]
  minPct?: number
  className?: string
}

function computeInitialPcts(n: number, initialPcts?: number[]): number[] {
  const specified = (initialPcts ?? []).slice(0, n)
  const unspecifiedCount = n - specified.length
  const specifiedSum = specified.reduce((a, b) => a + b, 0)
  const remaining = Math.max(0, 100 - specifiedSum)
  const fillPct = unspecifiedCount > 0 ? remaining / unspecifiedCount : 0
  return [...specified, ...Array(Math.max(0, unspecifiedCount)).fill(fillPct)]
}

export default function ResizableSplit({
  children,
  initialPcts,
  minPct = 10,
  className = '',
}: ResizableSplitProps) {
  const panels = React.Children.toArray(children)
  const n = panels.length

  const initPcts = computeInitialPcts(n, initialPcts)
  const [pcts, setPcts] = useState<number[]>(initPcts)
  const draggingRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const idx = draggingRef.current
      if (idx === null || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const cumPct = ((e.clientX - rect.left) / rect.width) * 100
      setPcts(prev => {
        const next = [...prev]
        const beforeIdx = next.slice(0, idx).reduce((a, b) => a + b, 0)
        const newSize = cumPct - beforeIdx
        const maxSize = prev[idx] + prev[idx + 1] - minPct
        const clamped = Math.max(minPct, Math.min(maxSize, newSize))
        const delta = clamped - next[idx]
        next[idx] = clamped
        next[idx + 1] -= delta
        return next
      })
    }
    function onUp() {
      if (draggingRef.current === null) return
      draggingRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [minPct])

  function startDrag(e: React.MouseEvent, dividerIdx: number) {
    e.preventDefault()
    draggingRef.current = dividerIdx
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div ref={containerRef} className={`w-full h-full flex flex-row ${className}`}>
      {panels.flatMap((panel, i) => {
        const els: ReactNode[] = [
          <div
            key={`panel-${i}`}
            className="h-full overflow-hidden"
            style={{ width: `${pcts[i]}%` }}
          >
            {panel}
          </div>,
        ]
        if (i < n - 1) {
          els.push(
            <div
              key={`divider-${i}`}
              onMouseDown={e => startDrag(e, i)}
              onDoubleClick={() => setPcts(initPcts)}
              className="w-[2px] shrink-0 bg-gray-200 hover:bg-gray-400 active:bg-gray-500 cursor-col-resize transition-colors"
            />
          )
        }
        return els
      })}
    </div>
  )
}
