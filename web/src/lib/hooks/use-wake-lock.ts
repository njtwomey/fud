import { useCallback, useEffect, useRef, useState } from 'react'

export interface WakeLockState {
  /** The browser can keep the screen on (Screen Wake Lock API, which also needs https or localhost). */
  supported: boolean
  /** The user has asked for the screen to stay on. */
  wanted: boolean
  /** The browser is actually holding the lock right now. It drops when the tab is hidden and returns with it. */
  active: boolean
  setWanted: (wanted: boolean) => void
}

/**
 * Keeps the screen awake while `wanted` is true. Browsers release the lock whenever the page is hidden (switching
 * tabs, locking the phone by hand, low battery), so it is asked for again as soon as the page is visible.
 */
export function useWakeLock(): WakeLockState {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [wanted, setWanted] = useState(false)
  const [active, setActive] = useState(false)
  const sentinel = useRef<WakeLockSentinel | null>(null)

  const acquire = useCallback(async () => {
    try {
      const lock = await navigator.wakeLock.request('screen')
      sentinel.current = lock
      setActive(true)
      lock.addEventListener('release', () => {
        if (sentinel.current === lock) sentinel.current = null
        setActive(false)
      })
    } catch {
      // Refused (battery saver, permissions policy, hidden page): stay off and let the toggle show it.
      setActive(false)
    }
  }, [])

  useEffect(() => {
    if (!wanted || !supported) return
    void acquire()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel.current) void acquire()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      const lock = sentinel.current
      sentinel.current = null
      void lock?.release()
      setActive(false)
    }
  }, [wanted, supported, acquire])

  return { supported, wanted, active, setWanted }
}
