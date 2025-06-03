/** Common type definitions. */
import type { AsymmetricMatcher } from '@vitest/expect'

/** Any function, for use in `extends` */
export type AnyFunction = (...args: never[]) => unknown

/** Accept a value or an AsymmetricMatcher in an arguments array */
export type WithMatchers<T extends unknown[]> = {
  [K in keyof T]: T[K] | AsymmetricMatcher<unknown>
}

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
