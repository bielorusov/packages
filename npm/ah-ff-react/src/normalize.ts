import type {
  FeatureFlag,
  FeatureFlagValueType,
  FeatureFlagWire,
} from './types'

const VALID_VALUE_TYPES: readonly FeatureFlagValueType[] = [
  'boolean',
  'text',
  'number',
]

function asValueType(raw: string | undefined): FeatureFlagValueType {
  if (raw && VALID_VALUE_TYPES.includes(raw as FeatureFlagValueType)) {
    return raw as FeatureFlagValueType
  }
  return 'text'
}

export function normalizeFlag(wire: FeatureFlagWire): FeatureFlag {
  return {
    name: wire.name,
    valueType: asValueType(wire.valueType ?? wire.value_type),
    value: wire.value,
  }
}

export function normalizeFlags(wires: FeatureFlagWire[] | undefined | null): FeatureFlag[] {
  if (!wires || !Array.isArray(wires)) {
    return []
  }
  return wires.map(normalizeFlag)
}

export function flagsByNameMap(
  flags: FeatureFlag[],
): Record<string, FeatureFlag> {
  return flags.reduce<Record<string, FeatureFlag>>((acc, flag) => {
    acc[flag.name] = flag
    return acc
  }, {})
}
