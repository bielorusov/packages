import type {
  CustomFieldDefinition,
  CustomFieldOptionType,
  CustomFieldType,
  FieldValidationError,
  FieldValidationResult,
  FieldValuesMap,
} from './types'

type MissingableValue = string | string[] | undefined

function missingValue(value: MissingableValue): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

function normalizeEmail(value: string): string {
  return value.toLowerCase()
}

function isValidNumeric(value: string): boolean {
  const trimmed = value.trim()
  // A permissive decimal matcher similar to Decimal.parse, minus exponent forms.
  // This is enough for typical "amount" strings used in the app.
  return /^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)
}

function normalizeNumeric(value: string): string {
  return value.trim()
}

function validateInputField(
  definition: CustomFieldDefinition,
  value: string,
): { ok: true; normalized: string } | { ok: false; error: FieldValidationError } {
  const optionType: CustomFieldOptionType =
    (definition.fieldOptionType ?? 'STRING').toUpperCase() as CustomFieldOptionType

  if (optionType === 'EMAIL') {
    const email = value
    const emailFormat = /^[^\s]+@[^\s]+$/
    if (!emailFormat.test(email)) {
      return {
        ok: false,
        error: { label: definition.label, message: 'has invalid format' },
      }
    }
    return { ok: true, normalized: normalizeEmail(email) }
  }

  if (optionType === 'NUMERIC') {
    if (!isValidNumeric(value)) {
      return {
        ok: false,
        error: { label: definition.label, message: 'must be a valid number' },
      }
    }
    return { ok: true, normalized: normalizeNumeric(value) }
  }

  // STRING
  if (typeof value !== 'string') {
    return {
      ok: false,
      error: { label: definition.label, message: 'must be a string' },
    }
  }
  return { ok: true, normalized: value }
}

function validateSelectField(
  definition: CustomFieldDefinition,
  value: unknown,
): { ok: true; normalized: string } | { ok: false; error: FieldValidationError } {
  if (typeof value !== 'string') {
    return {
      ok: false,
      error: { label: definition.label, message: 'must be a string' },
    }
  }
  if (!definition.fieldOptions.includes(value)) {
    return {
      ok: false,
      error: { label: definition.label, message: 'is not included in the list' },
    }
  }
  return { ok: true, normalized: value }
}

function validateMultipleSelectField(
  definition: CustomFieldDefinition,
  value: unknown,
): { ok: true; normalized: string[] } | { ok: false; error: FieldValidationError } {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      error: { label: definition.label, message: 'must be a list of strings' },
    }
  }
  const values = value
  if (!values.every((v) => typeof v === 'string')) {
    return {
      ok: false,
      error: { label: definition.label, message: 'must be a list of strings' },
    }
  }
  const invalid = values.filter((v) => !definition.fieldOptions.includes(v))
  if (invalid.length > 0) {
    return {
      ok: false,
      error: { label: definition.label, message: 'contains invalid options' },
    }
  }
  return { ok: true, normalized: values as string[] }
}

export function validateFieldValues(
  customFields: CustomFieldDefinition[],
  values: FieldValuesMap,
): FieldValidationResult {
  const allowedLabels = new Set(customFields.map((f) => f.label))

  const errors: FieldValidationError[] = []

  // Unknown labels
  for (const label of Object.keys(values)) {
    if (!allowedLabels.has(label)) {
      errors.push({ label, message: 'is not allowed' })
    }
  }

  // Required labels
  for (const definition of customFields) {
    if (!definition.isRequired) continue
    const value = values[definition.label] as string | string[] | undefined
    if (missingValue(value)) {
      errors.push({ label: definition.label, message: "can't be blank" })
    }
  }

  // Field-specific validation
  for (const definition of customFields) {
    const raw = values[definition.label] as string | string[] | undefined
    if (missingValue(raw)) {
      continue
    }

    const fieldType: CustomFieldType = definition.fieldType

    if (fieldType === 'INPUT') {
      if (typeof raw !== 'string') {
        errors.push({
          label: definition.label,
          message: 'must be a string',
        })
        continue
      }

      const result = validateInputField(definition, raw)
      if (!result.ok) errors.push(result.error)
      continue
    }

    if (fieldType === 'SELECT') {
      const result = validateSelectField(definition, raw)
      if (!result.ok) errors.push(result.error)
      continue
    }

    if (fieldType === 'MULTIPLE_SELECT') {
      const result = validateMultipleSelectField(definition, raw)
      if (!result.ok) errors.push(result.error)
      continue
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  // Normalization: mirror backend normalize_all behaviour (skip missing values).
  const normalized: FieldValuesMap = {}
  for (const definition of customFields) {
    const raw = values[definition.label] as string | string[] | undefined
    if (missingValue(raw)) continue

    if (definition.fieldType === 'INPUT') {
      if (typeof raw !== 'string') continue
      const optionType = (definition.fieldOptionType ?? 'STRING').toUpperCase()
      if (optionType === 'EMAIL') {
        normalized[definition.label] = normalizeEmail(raw)
      } else if (optionType === 'NUMERIC') {
        normalized[definition.label] = normalizeNumeric(raw)
      } else {
        normalized[definition.label] = raw
      }
      continue
    }

    normalized[definition.label] = raw as string | string[]
  }

  return { ok: true, normalized }
}

export function formatValidationErrors(
  errors: FieldValidationError[],
): string {
  return errors.map((e) => `${e.label}: ${e.message}`).join('; ')
}

