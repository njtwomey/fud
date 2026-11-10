import { useCallback, useState } from 'react'

function read<T>(key: string, initial: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? initial : (JSON.parse(raw) as T)
  } catch {
    return initial
  }
}

/** State persisted to localStorage. Falls back to in-memory state when storage is unavailable or corrupt. */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, initial))
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // Storage is a convenience only: ignore quota and privacy-mode errors.
        }
        return resolved
      })
    },
    [key],
  )
  return [value, set]
}
