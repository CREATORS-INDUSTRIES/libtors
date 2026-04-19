import { useEffect, useRef, useState } from 'react'

interface Props {
  duration?: number
  width?: number
  done?: boolean
  onComplete?: () => void
}

export default function ProgressBar({ duration = 1000, width = 240, done = false, onComplete }: Props) {
  const [progress, setProgress] = useState(0)
  const [complete, setComplete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (complete) return

    if (done) {
      setProgress(60)
      setComplete(true)
      clearInterval(timerRef.current)
      onComplete?.()
      return
    }

    const steps = 60
    const stepDuration = duration / steps

    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 1
        if (next >= steps) {
          setComplete(true)
          clearInterval(timerRef.current)
          onComplete?.()
          return steps
        }
        return next
      })
    }, stepDuration)

    return () => clearInterval(timerRef.current)
  }, [duration, onComplete, done, complete])

  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full bg-gray-200 overflow-hidden"
        style={{ width, height: 5 }}
      >
        <div
          className="h-full rounded-full transition-all duration-75 ease-out"
          style={{
            width: `${(progress / 60) * 100}%`,
            backgroundColor: complete ? '#1a1a1a' : '#4a4a4a',
          }}
        />
      </div>
    </div>
  )
}
