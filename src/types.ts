/** Common type definitions. */

/** Any function, for use in `extends` */
export type AnyFunction = (...args: never[]) => unknown

/**
 * Minimally typed version of Vitest's `MockInstance`.
 *
 * Used to ensure backwards compatibility
 * with older versions of Vitest.
 */
export interface MockInstance<TFunc extends AnyFunction = AnyFunction> {
  getMockName(): string
  getMockImplementation(): TFunc | undefined
  mockImplementation: (impl: TFunc) => this
  mock: MockContext<TFunc>
}

export interface MockContext<TFunc extends AnyFunction> {
  calls: Parameters<TFunc>[]
}
