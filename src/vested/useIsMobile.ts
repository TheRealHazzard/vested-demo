import { useSyncExternalStore } from 'react'

/** Phone and small-tablet widths get the phone layout; wide screens keep the desktop one. */
const QUERY = '(max-width: 899px)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
