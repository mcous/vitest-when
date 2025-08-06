/** Common type definitions. */
import type { AsymmetricMatcher } from '@vitest/expect'

/** Any function. */
export type AnyFunction = (...args: never[]) => unknown

/** Any constructor. */
export type AnyConstructor = new (...args: never[]) => unknown

/** Any callable, for use in `extends` */
export type AnyCallable = AnyFunction | AnyConstructor

/** Extract parameters from either a function or constructor. */
export type ExtractParameters<T> = T extends new (...args: infer P) => unknown
  ? P
  : T extends (...args: infer P) => unknown
    ? P
    : never

/** Extract return type from either a function or constructor */
export type ExtractReturnType<T> = T extends new (...args: never[]) => infer R
  ? R
  : T extends (...args: never[]) => infer R
    ? R
    : never

/** Accept a value or an AsymmetricMatcher in an arguments array */
export type WithMatchers<T extends unknown[]> = {
  [K in keyof T]: AsymmetricMatcher<unknown> | T[K]
}

/**
 * Minimally typed version of Vitest's `MockInstance`.
 *
 * Used to ensure backwards compatibility
 * with older versions of Vitest.
 */
export interface MockInstance<TFunc extends AnyCallable = AnyCallable> {
  getMockName(): string
  getMockImplementation(): TFunc | undefined
  mockImplementation: (impl: TFunc) => this
  mock: MockContext<TFunc>
}

export interface MockContext<TFunc extends AnyCallable> {
  calls: ExtractParameters<TFunc>[]
}
