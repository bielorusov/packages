import { useContext } from 'react'
import { EndpointsContext } from './context'
import type {
  EndpointsContextValue,
  EndpointFormConfig,
  FieldValuesMap,
  FieldValidationResult,
  Offer,
} from './types'

export function useEndpoints(): EndpointsContextValue {
  const ctx = useContext(EndpointsContext)
  if (!ctx) {
    throw new Error('useEndpoints must be used within an EndpointsProvider')
  }
  return ctx
}

export function useEndpointFormConfig(): {
  formConfig: EndpointFormConfig | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const { formConfig, loading, error, reload } = useEndpoints()
  return { formConfig, loading, error, reload }
}

export function useCreateOffer(): {
  createOffer: (values: FieldValuesMap) => Promise<Offer>
  submitting: boolean
  submitError: string | null
  lastOffer: Offer | null
  validate: (values: FieldValuesMap) => FieldValidationResult
} {
  const { createOffer, submitting, submitError, lastOffer, validate } =
    useEndpoints()
  return { createOffer, submitting, submitError, lastOffer, validate }
}

