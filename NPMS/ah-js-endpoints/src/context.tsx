import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createConfig } from './config'
import {
  fetchEndpointFormConfig,
  submitCreateOffer,
} from './graphqlClient'
import { toFieldValueEntries } from './fieldValues'
import { validateFieldValues } from './validate'
import type {
  EndpointsConfigInput,
  EndpointsContextValue,
  EndpointsProviderProps,
  FieldValuesMap,
  Offer,
  FieldValidationResult,
  ResolvedEndpointsConfig,
} from './types'

export const EndpointsContext =
  createContext<EndpointsContextValue | null>(null)

function resolveConfig(
  configInput: EndpointsConfigInput,
): ResolvedEndpointsConfig {
  return createConfig(configInput)
}

export function EndpointsProvider({
  config: configInput,
  autoLoad = true,
  fetchImpl,
  children,
}: EndpointsProviderProps) {
  const config = useMemo(
    () => resolveConfig(configInput),
    [configInput],
  )

  const [formConfig, setFormConfig] = useState<
    EndpointsContextValue['formConfig']
  >(null)
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastOffer, setLastOffer] = useState<Offer | null>(null)

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const reload = useCallback(async () => {
    try {
      if (!mountedRef.current) return
      setLoading(true)
      setError(null)
      const next = await fetchEndpointFormConfig(config, fetchImpl ?? fetch)
      if (!mountedRef.current) return
      setFormConfig(next)
      setLoading(false)
    } catch (err) {
      if (!mountedRef.current) return
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setLoading(false)
    }
  }, [config, fetchImpl])

  useEffect(() => {
    if (!autoLoad) {
      setLoading(false)
      return
    }
    void reload()
  }, [autoLoad, reload])

  const validate = useCallback(
    (values: FieldValuesMap): FieldValidationResult =>
      validateFieldValues(formConfig?.customFields ?? [], values),
    [formConfig],
  )

  const createOffer = useCallback(
    async (values: FieldValuesMap): Promise<Offer> => {
      if (!formConfig) {
        const message = 'ah-js-endpoints: endpointFormConfig is not loaded'
        setSubmitError(message)
        throw new Error(message)
      }

      const validation = validateFieldValues(formConfig.customFields, values)
      if (!validation.ok) {
        const message = validation.errors
          .map((e) => `${e.label}: ${e.message}`)
          .join('; ')
        setSubmitError(message)
        throw new Error(message)
      }

      try {
        if (!mountedRef.current) {
          throw new Error('Component unmounted')
        }
        setSubmitting(true)
        setSubmitError(null)
        const input = { fieldValues: toFieldValueEntries(validation.normalized) }
        const offer = await submitCreateOffer(config, input, fetchImpl ?? fetch)
        if (!mountedRef.current) return offer
        setLastOffer(offer)
        setSubmitting(false)
        return offer
      } catch (err) {
        if (!mountedRef.current) throw err
        const message = err instanceof Error ? err.message : String(err)
        setSubmitError(message)
        setSubmitting(false)
        throw err
      }
    },
    [config, fetchImpl, formConfig],
  )

  const ctx = useMemo<EndpointsContextValue>(
    () => ({
      formConfig,
      loading,
      error,
      config,
      submitting,
      submitError,
      lastOffer,
      reload,
      validate,
      createOffer,
    }),
    [
      config,
      createOffer,
      error,
      formConfig,
      lastOffer,
      loading,
      reload,
      submitError,
      submitting,
      validate,
    ],
  )

  return (
    <EndpointsContext.Provider value={ctx}>
      {children}
    </EndpointsContext.Provider>
  )
}

