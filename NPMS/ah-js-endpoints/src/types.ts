import type { ReactNode } from 'react'

export type CustomFieldType = 'INPUT' | 'SELECT' | 'MULTIPLE_SELECT'
export type CustomFieldOptionType = 'EMAIL' | 'NUMERIC' | 'STRING'

export type CustomFieldDefinition = {
  name: string
  label: string
  fieldType: CustomFieldType
  fieldOptionType: CustomFieldOptionType | null
  fieldOptions: string[]
  isRequired: boolean
}

export type CustomFieldDisplay = {
  name: string
  label: string
  value: string | null
}

export type EndpointFormConfig = {
  endpointType: string
  domains: string[]
  customFields: CustomFieldDefinition[]
}

export type OfferFieldValueInput = {
  label: string
  value?: string
  values?: string[]
}

export type CreateOfferInput = {
  fieldValues: OfferFieldValueInput[]
}

export type Offer = {
  id: string
  fieldValues: Record<string, unknown> | null
  domain: string
  archived: boolean
  userId: string | null
  endpointId: string | null
  displayFields: CustomFieldDisplay[]
  endpointType: string | null
  createdAt: string
}

export type FieldValuesMap = Record<string, string | string[]>

export type EndpointsConfigInput = {
  clientKey: string
  baseUrl?: string
  origin?: string
}

export type ResolvedEndpointsConfig = {
  clientKey: string
  baseUrl: string
  graphqlUrl: string
  origin: string
}

export type FieldValidationError = {
  label: string
  message: string
}

export type FieldValidationResult =
  | { ok: true; normalized: FieldValuesMap }
  | { ok: false; errors: FieldValidationError[] }

export type EndpointsContextValue = {
  formConfig: EndpointFormConfig | null
  loading: boolean
  error: string | null
  config: ResolvedEndpointsConfig
  submitting: boolean
  submitError: string | null
  lastOffer: Offer | null
  reload: () => Promise<void>
  validate: (values: FieldValuesMap) => FieldValidationResult
  createOffer: (values: FieldValuesMap) => Promise<Offer>
}

export type EndpointsProviderProps = {
  config: EndpointsConfigInput
  autoLoad?: boolean
  fetchImpl?: typeof fetch
  children: ReactNode
}

export type CustomFieldDefinitionWire = {
  name?: string
  label?: string
  fieldType?: string
  field_type?: string
  fieldOptionType?: string | null
  field_option_type?: string | null
  fieldOptions?: string[]
  field_options?: string[]
  isRequired?: boolean
  is_required?: boolean
}

export type EndpointFormConfigWire = {
  endpointType?: string
  endpoint_type?: string
  domains?: string[]
  customFields?: CustomFieldDefinitionWire[]
  custom_fields?: CustomFieldDefinitionWire[]
}

export type CustomFieldDisplayWire = {
  name?: string
  label?: string
  value?: unknown
}

export type OfferWire = {
  id?: string
  fieldValues?: Record<string, unknown> | null
  field_values?: Record<string, unknown> | null
  domain?: string
  archived?: boolean
  userId?: string | null
  user_id?: string | null
  endpointId?: string | null
  endpoint_id?: string | null
  displayFields?: CustomFieldDisplayWire[]
  display_fields?: CustomFieldDisplayWire[]
  endpointType?: string | null
  endpoint_type?: string | null
  createdAt?: string
  created_at?: string
}
