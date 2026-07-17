import type { FeatureFlag, FeatureFlagValue } from './types'
import { flagsByNameMap } from './normalize'

export function findFlag(
  flags: FeatureFlag[],
  name: string,
): FeatureFlag | undefined {
  return flags.find((flag) => flag.name === name)
}

export function getFlagValue(
  flags: FeatureFlag[],
  name: string,
  defaultValue?: FeatureFlagValue,
): FeatureFlagValue | undefined {
  const flag = findFlag(flags, name)
  if (!flag) {
    return defaultValue
  }
  return flag.value
}

export function isFlagEnabled(
  flags: FeatureFlag[],
  name: string,
  defaultValue = false,
): boolean {
  const flag = findFlag(flags, name)
  if (!flag) {
    return defaultValue
  }
  if (flag.valueType === 'boolean') {
    return flag.value === true
  }
  return Boolean(flag.value)
}

export function getBooleanFlag(
  flags: FeatureFlag[],
  name: string,
  defaultValue = false,
): boolean {
  const flag = findFlag(flags, name)
  if (!flag) {
    return defaultValue
  }
  if (typeof flag.value === 'boolean') {
    return flag.value
  }
  if (typeof flag.value === 'string') {
    return flag.value === 'true'
  }
  return Boolean(flag.value)
}

export function getNumberFlag(
  flags: FeatureFlag[],
  name: string,
  defaultValue = 0,
): number {
  const flag = findFlag(flags, name)
  if (!flag) {
    return defaultValue
  }
  if (typeof flag.value === 'number' && !Number.isNaN(flag.value)) {
    return flag.value
  }
  if (typeof flag.value === 'string') {
    const parsed = Number(flag.value)
    return Number.isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

export function getStringFlag(
  flags: FeatureFlag[],
  name: string,
  defaultValue = '',
): string {
  const flag = findFlag(flags, name)
  if (!flag) {
    return defaultValue
  }
  if (typeof flag.value === 'string') {
    return flag.value
  }
  return String(flag.value)
}

export function toFlagsByName(
  flags: FeatureFlag[],
): Record<string, FeatureFlag> {
  return flagsByNameMap(flags)
}
