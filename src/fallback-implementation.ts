import type { AnyCallable, MockInstance } from './types.ts'

export function getFallbackImplementation<TFunc extends AnyCallable>(
  spy: MockInstance<TFunc>,
) {
  // In vitest@<4, getMockImplementation() returns undefined after calling mockReset(), even
  // if the mock was initialized with vi.fn(impl) and impl is still active.
  // In this case, case the actual implementation from the wrapped tinyspy object.
  return spy.getMockImplementation() ?? getTinyspyOriginalImplementation(spy)
}

function getTinyspyOriginalImplementation<TFunc extends AnyCallable>(
  maybeTinyspy: MockInstance<TFunc>,
): TFunc | undefined {
  // tinyspy stores its internal state in a symbol property of the spy instance.
  // This state "survives" vitest's mockReset and is the basis for returning the original
  // function's behavior (the one it was instantiated with).
  // Note that the state's impl field is not the original implementation after a reset, but getOriginal() is.
  for (const sym of Object.getOwnPropertySymbols(maybeTinyspy)) {
    const maybeTinyspyInternals = (
      maybeTinyspy as unknown as { [sym]: unknown }
    )[sym]
    if (
      maybeTinyspyInternals &&
      typeof maybeTinyspyInternals === 'object' &&
      'getOriginal' in maybeTinyspyInternals &&
      typeof maybeTinyspyInternals.getOriginal === 'function'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return maybeTinyspyInternals.getOriginal() as TFunc
    }
  }
  return undefined
}
