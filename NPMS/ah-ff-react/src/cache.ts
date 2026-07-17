import type { FeatureFlag } from './types'

export type FlagCachePayload = {
  flags: FeatureFlag[]
  updatedAt: number
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readFlagCache(storageKey: string): FlagCachePayload | null {
  if (!canUseLocalStorage()) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as FlagCachePayload
    if (!parsed || !Array.isArray(parsed.flags)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeFlagCache(
  storageKey: string,
  flags: FeatureFlag[],
): void {
  if (!canUseLocalStorage()) {
    return
  }
  try {
    const payload: FlagCachePayload = {
      flags,
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    // Quota / private mode — ignore
  }
}

export function clearFlagCache(storageKey: string): void {
  if (!canUseLocalStorage()) {
    return
  }
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // ignore
  }
}
