import { useEffect, useRef, useState } from 'react'
import { isBrowser } from './dom'
import { encodeJson, decodeJson } from './json'

/**
 * SessionStorage-backed state hook.
 *
 * - Reads initial value from sessionStorage (JSON-encoded), falling back to `initialValue`.
 * - Writes any changes back to sessionStorage.
 * - Exposes a `reset` helper to go back to `initialValue` and remove the key.
 *
 * @example
 * ```tsx
 * const { value, setValue, reset } = useSessionStorage('sidebar_open', true)
 *
 * setValue(false)
 * setValue((prev) => !prev)
 * reset()
 * ```
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  const skipNextWrite = useRef(false)

  const readValue = (): T => {
    if (!isBrowser()) {
      return initialValue
    }
    const raw = sessionStorage.getItem(key)
    return decodeJson<T>(raw ?? null, initialValue)
  }

  const [value, setValueState] = useState<T>(readValue)

  useEffect(() => {
    if (!isBrowser()) return
    if (skipNextWrite.current) {
      skipNextWrite.current = false
      return
    }
    sessionStorage.setItem(key, encodeJson<T>(value))
  }, [key, value])

  const setValue = (next: T | ((prev: T) => T)) => {
    setValueState(prev => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next))
  }

  const reset = () => {
    skipNextWrite.current = true
    setValueState(initialValue)
    if (isBrowser()) {
      sessionStorage.removeItem(key)
    }
  }

  return { value, setValue, reset }
}
