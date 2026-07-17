import { useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import { isBrowser } from './dom'
import { encodeJson, decodeJson } from './json'

export type CookieOptions = Cookies.CookieAttributes

const defaultOptions: CookieOptions = {
  secure: true,
  expires: 365,
  path: '/',
}

/**
 * Cookie-backed state hook (JSON-encoded via `js-cookie`).
 *
 * - Reads initial value from a cookie, falling back to `initialValue`.
 * - Writes any changes back to the cookie.
 * - Exposes a `reset` helper to restore `initialValue` and remove the cookie.
 *
 * @example
 * ```tsx
 * const { value, setValue, reset } = useCookieStorage('prefs', { theme: 'dark' }, {
 *   secure: true,
 *   expires: 30,
 *   path: '/',
 * })
 * ```
 */
export function useCookieStorage<T>(
  key: string,
  initialValue: T,
  options: CookieOptions = defaultOptions,
) {
  const skipNextWrite = useRef(false)

  const readValue = (): T => {
    if (!isBrowser()) {
      return initialValue
    }
    const raw = Cookies.get(key)
    return decodeJson<T>(raw ?? null, initialValue)
  }

  const [value, setValueState] = useState<T>(readValue)

  useEffect(() => {
    if (!isBrowser()) return
    if (skipNextWrite.current) {
      skipNextWrite.current = false
      return
    }
    Cookies.set(key, encodeJson<T>(value), options)
  }, [key, value, options])

  const setValue = (next: T | ((prev: T) => T)) => {
    setValueState(prev => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next))
  }

  const reset = () => {
    skipNextWrite.current = true
    setValueState(initialValue)
    if (isBrowser()) {
      Cookies.remove(key, { path: options.path ?? '/' })
    }
  }

  return { value, setValue, reset }
}
