import { useEffect, useRef, useState } from 'react'

/**
 * Copy to the clipboard, with the "copied" flag that every copy affordance
 * needs and the two things one forgets: the reset timer is cleared on unmount,
 * and a refused clipboard is not an exception the caller has to catch.
 *
 *   const { copied, copy } = useCopy()
 *   <button onClick={() => copy(command)}>{copied ? 'Copied' : 'Copy'}</button>
 */
export function useCopy(resetMs = 1600) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Refused: insecure origin, or the permission was denied. Callers show
      // the text as selectable in the first place, so there is still a way to
      // take it, and a thrown error here would only break the caller.
      return
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), resetMs)
  }

  return { copied, copy }
}
