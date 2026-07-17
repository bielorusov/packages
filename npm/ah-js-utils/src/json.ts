export const encodeJson = <T,>(value: T): string => JSON.stringify(value)

export const decodeJson = <T,>(raw: string | null, fallback: T): T => {
  if (raw === null || raw === '') return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
