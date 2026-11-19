import { useEffect, useRef, useState } from 'react'

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Eases a number up to its target the first time it appears, then follows it exactly.
 * Skipped entirely for people who ask the system for less motion.
 */
export function useCountUp(target: number, ms = 900): number {
  const [value, setValue] = useState(() => (reduced() ? target : 0))
  const played = useRef(reduced())

  useEffect(() => {
    if (played.current || target === 0) {
      setValue(target)
      return
    }
    played.current = true
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1)
      setValue(target * (1 - (1 - t) ** 3))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])

  return value
}
