import type { AnyCallable, MockInstance } from './types.ts'

/** Get the fallback implementation of a mock if no matching stub is found. */
export const getFallbackImplementation = <TFunc extends AnyCallable>(
  mock: MockInstance<TFunc>,
): TFunc | undefined => {
  return (
    mock.getMockImplementation() ?? getTinyspyInternals(mock)?.getOriginal()
  )
}

/** Internal state from Tinyspy, where a mock's default implementation is stored. */
interface TinyspyInternals<TFunc extends AnyCallable> {
  getOriginal: () => TFunc | undefined
}

/**
 * Get the fallback implementation out of tinyspy internals.
 *
 * This slight hack works around a bug in Vitest <= 3
 * where `getMockImplementation` will return `undefined` after `mockReset`,
 * even if a default implementation is still active.
 * The implementation remains present in tinyspy internal state,
 * which is stored on a Symbol key in the mock object.
 */
const getTinyspyInternals = <TFunc extends AnyCallable>(
  mock: MockInstance<TFunc>,
): TinyspyInternals<TFunc> | undefined => {
  const maybeTinyspy = mock as unknown as Record<PropertyKey, unknown>

  for (const key of Object.getOwnPropertySymbols(maybeTinyspy)) {
    const maybeTinyspyInternals = maybeTinyspy[key]

    if (
      maybeTinyspyInternals &&
      typeof maybeTinyspyInternals === 'object' &&
      'getOriginal' in maybeTinyspyInternals &&
      typeof maybeTinyspyInternals.getOriginal === 'function'
    ) {
      return maybeTinyspyInternals as TinyspyInternals<TFunc>
    }
  }

  return undefined
}
