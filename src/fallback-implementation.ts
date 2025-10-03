import type { AsFunction, Mock } from './types.ts'

/** Get the fallback implementation of a mock if no matching stub is found. */
export const getFallbackImplementation = <TMock extends Mock>(
  mock: TMock,
): AsFunction<TMock> | undefined => {
  return (
    (mock.getMockImplementation() as AsFunction<TMock> | undefined) ??
    getTinyspyInternals(mock)?.getOriginal()
  )
}

/** Internal state from Tinyspy, where a mock's default implementation is stored. */
interface TinyspyInternals<TMock extends Mock> {
  getOriginal: () => AsFunction<TMock> | undefined
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
const getTinyspyInternals = <TMock extends Mock>(
  mock: TMock,
): TinyspyInternals<TMock> | undefined => {
  const maybeTinyspy = mock as unknown as Record<PropertyKey, unknown>

  for (const key of Object.getOwnPropertySymbols(maybeTinyspy)) {
    const maybeTinyspyInternals = maybeTinyspy[key]

    if (
      maybeTinyspyInternals &&
      typeof maybeTinyspyInternals === 'object' &&
      'getOriginal' in maybeTinyspyInternals &&
      typeof maybeTinyspyInternals.getOriginal === 'function'
    ) {
      return maybeTinyspyInternals as TinyspyInternals<TMock>
    }
  }

  return undefined
}
