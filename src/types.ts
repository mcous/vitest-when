/** Common type definitions. */
import type { AsymmetricMatcher } from '@vitest/expect'
import type { MockedClass, MockedFunction } from 'vitest'

/** Any function. */
export type AnyFunction = (...args: never[]) => unknown

/** Any constructor. */
export type AnyConstructor = new (...args: never[]) => unknown

/** Any callable, for use in `extends` */
export type AnyCallable = AnyFunction | AnyConstructor

/** Extract parameters from either a function or constructor. */
export type ParametersOf<TFunc extends AnyCallable> = TFunc extends new (
  ...args: infer P
) => unknown
  ? P
  : TFunc extends (...args: infer P) => unknown
    ? P
    : never

/** Extract return type from either a function or constructor */
export type ReturnTypeOf<TFunc extends AnyCallable> = TFunc extends new (
  ...args: never[]
) => infer R
  ? R
  : TFunc extends (...args: never[]) => infer R
    ? R
    : never

export type AsFunction<TFunc extends AnyCallable> = (
  ...args: ParametersOf<TFunc>
) => ReturnTypeOf<TFunc>

/** Accept a value or an AsymmetricMatcher in an arguments array */
export type WithMatchers<T extends unknown[]> = {
  [K in keyof T]: AsymmetricMatcher<unknown> | T[K]
}

export type Mock<TFunc extends AnyCallable> = TFunc extends AnyFunction
  ? MockedFunction<TFunc>
  : TFunc extends AnyConstructor
    ? MockedClass<TFunc>
    : never
