import { useEffect, useState, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

// False during server rendering and hydration, true afterwards. Use it to gate output that depends
// on the browser (time zone, clock, randomness) so server and client markup match.
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

// Current time in ms, or null until mounted; updates every `interval` ms.
export function useNow(interval = 1000) {
  const [now, setNow] = useState(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, interval)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [interval])
  return now
}
