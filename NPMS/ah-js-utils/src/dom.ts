/** Safe for SSR / non-DOM environments. */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}
