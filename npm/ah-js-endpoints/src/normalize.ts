import type {
  CustomFieldDefinition,
  CustomFieldDefinitionWire,
  CustomFieldDisplay,
  CustomFieldDisplayWire,
  EndpointFormConfig,
  EndpointFormConfigWire,
  Offer,
  OfferWire,
  CustomFieldType,
  CustomFieldOptionType,
} from './types'

function normalizeEnumValue<TEnum extends string>(
  value: unknown,
  allowedValues: readonly TEnum[],
  defaultValue: TEnum,
): TEnum {
  if (typeof value !== 'string' || value.trim() === '') {
    return defaultValue
  }
  const normalized = value.toUpperCase().replace(/-/g, '_')
  return (allowedValues as readonly string[]).includes(normalized)
    ? (normalized as TEnum)
    : defaultValue
}

const FIELD_TYPES: readonly CustomFieldType[] = [
  'INPUT',
  'SELECT',
  'MULTIPLE_SELECT',
]

const FIELD_OPTION_TYPES: readonly CustomFieldOptionType[] = [
  'EMAIL',
  'NUMERIC',
  'STRING',
]

export function normalizeCustomField(
  wire: CustomFieldDefinitionWire,
): CustomFieldDefinition {
  const fieldType = normalizeEnumValue<CustomFieldType>(
    wire.fieldType ?? wire.field_type,
    FIELD_TYPES,
    'INPUT',
  )

  const fieldOptionType = (() => {
    const raw = wire.fieldOptionType ?? wire.field_option_type
    if (raw === null || raw === undefined) return null
    return normalizeEnumValue<CustomFieldOptionType>(
      raw,
      FIELD_OPTION_TYPES,
      'STRING',
    )
  })()

  const fieldOptionsRaw = wire.fieldOptions ?? wire.field_options ?? []
  const fieldOptions = Array.isArray(fieldOptionsRaw)
    ? fieldOptionsRaw.filter((x): x is string => typeof x === 'string')
    : []

  return {
    name: wire.name ?? '',
    label: wire.label ?? '',
    fieldType,
    fieldOptionType,
    fieldOptions,
    isRequired: wire.isRequired ?? wire.is_required ?? false,
  }
}

export function normalizeEndpointFormConfig(
  wire: EndpointFormConfigWire,
): EndpointFormConfig {
  const endpointType = wire.endpointType ?? wire.endpoint_type ?? ''
  const domainsRaw = wire.domains ?? []
  const domains = Array.isArray(domainsRaw)
    ? domainsRaw.filter((x): x is string => typeof x === 'string')
    : []

  const customFieldsRaw = wire.customFields ?? wire.custom_fields ?? []
  const customFields = Array.isArray(customFieldsRaw)
    ? customFieldsRaw.map(normalizeCustomField)
    : []

  return {
    endpointType,
    domains,
    customFields,
  }
}

function normalizeDisplayValue(wire: CustomFieldDisplayWire['value']): string | null {
  if (wire === null || wire === undefined) return null
  if (typeof wire === 'string') return wire
  return String(wire)
}

function normalizeCustomFieldDisplay(
  wire: CustomFieldDisplayWire,
): CustomFieldDisplay {
  return {
    name: wire.name ?? '',
    label: wire.label ?? '',
    value: normalizeDisplayValue(wire.value),
  }
}

export function normalizeOffer(wire: OfferWire): Offer {
  return {
    id: wire.id ?? '',
    fieldValues: wire.fieldValues ?? wire.field_values ?? null,
    domain: wire.domain ?? '',
    archived: wire.archived ?? false,
    userId: wire.userId ?? wire.user_id ?? null,
    endpointId: wire.endpointId ?? wire.endpoint_id ?? null,
    displayFields: (wire.displayFields ?? wire.display_fields ?? []).map(
      normalizeCustomFieldDisplay,
    ),
    endpointType: wire.endpointType ?? wire.endpoint_type ?? null,
    createdAt: wire.createdAt ?? wire.created_at ?? '',
  }
}

