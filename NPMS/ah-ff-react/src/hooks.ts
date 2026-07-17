import { useContext } from 'react'
import { FeatureFlagsContext } from './context'
import type { FeatureFlag, FeatureFlagValue, FeatureFlagsContextValue } from './types'
import {
  getBooleanFlag,
  getNumberFlag,
  getStringFlag,
} from './utils'

export function useFeatureFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext)
  if (!ctx) {
    throw new Error(
      'useFeatureFlags must be used within a FeatureFlagsProvider',
    )
  }
  return ctx
}

export function useFeatureFlag(name: string): {
  flag: FeatureFlag | undefined
  loading: boolean
  error: string | null
} {
  const { flagsByName, loading, error } = useFeatureFlags()
  return {
    flag: flagsByName[name],
    loading,
    error,
  }
}

export function useFeatureFlagValue(
  name: string,
): FeatureFlagValue | undefined
export function useFeatureFlagValue<T extends FeatureFlagValue>(
  name: string,
  defaultValue: T,
): T
export function useFeatureFlagValue(
  name: string,
  defaultValue?: FeatureFlagValue,
): FeatureFlagValue | undefined {
  const { flagsByName } = useFeatureFlags()
  const flag = flagsByName[name]
  if (!flag) {
    return defaultValue
  }
  return flag.value
}

export function useBooleanFlag(name: string, defaultValue = false): boolean {
  const { flags } = useFeatureFlags()
  return getBooleanFlag(flags, name, defaultValue)
}

export function useNumberFlag(name: string, defaultValue = 0): number {
  const { flags } = useFeatureFlags()
  return getNumberFlag(flags, name, defaultValue)
}

export function useStringFlag(name: string, defaultValue = ''): string {
  const { flags } = useFeatureFlags()
  return getStringFlag(flags, name, defaultValue)
}
