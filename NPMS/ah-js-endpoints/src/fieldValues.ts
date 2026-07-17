import type { FieldValuesMap, OfferFieldValueInput } from './types'

export function toFieldValueEntries(
  values: FieldValuesMap,
): OfferFieldValueInput[] {
  return Object.entries(values).map(([label, value]) => {
    if (Array.isArray(value)) {
      return { label, values: value }
    }
    return { label, value }
  })
}

export function fromFieldValueEntries(
  entries: OfferFieldValueInput[],
): FieldValuesMap {
  const result: FieldValuesMap = {}

  for (const entry of entries) {
    if (entry.values) {
      result[entry.label] = entry.values
      continue
    }
    if (entry.value !== undefined) {
      result[entry.label] = entry.value
    }
  }

  return result
}

