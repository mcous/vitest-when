/* eslint-disable @typescript-eslint/no-explicit-any */
/** Common type definitions. */
import type { AsymmetricMatcher } from '@vitest/expect'
import type { MockedClass, MockedFunction } from 'vitest'

/** Any function. */
export type AnyFunction = (...args: any[]) => any

/** Any constructor. */
export type AnyConstructor = new (...args: any[]) => any

/** Any mockable interface */
export type AnyMockable = AnyFunction | AnyConstructor

/**
 * Minimally typed version of Vitest's `MockInstance`.
 *
 * Ensures backwards compatibility with vitest@<2
 */
export interface MockInstance<TFunc extends AnyMockable = AnyMockable> {
  getMockName(): string
  getMockImplementation(): AsFunction<TFunc> | undefined
  mockImplementation(impl: AsFunction<TFunc>): this
  mock: {
    calls: ParametersOf<TFunc>[]
  }
}

/**
 * Normalize an inferred mock.
 *
 * When inferring the function type from `MockInstance`, constructors
 * can create a union type instead of a single type due to the union
 * in `ConstructorImplementation`. This type collapses that union.
 *
 * Ensures backwards compatibility with vitest@<2, because this
 * inference issue only happens with a custom `MockInstance`.
 */
export type NormalizeMockable<TFunc extends AnyMockable> =
  ConstructorImplementation extends TFunc
    ? Extract<TFunc, AnyConstructor>
    : TFunc

/** Extract parameters from either a function or constructor. */
export type ParametersOf<TFunc extends AnyMockable> =
  TFunc extends AnyConstructor
    ? ConstructorParameters<TFunc>
    : TFunc extends AnyFunction
      ? Parameters<TFunc>
      : never

/** Extract return type from either a function or constructor */
export type ReturnTypeOf<TFunc extends AnyMockable> =
  TFunc extends AnyConstructor
    ? InstanceType<TFunc>
    : TFunc extends AnyFunction
      ? ReturnType<TFunc>
      : never

/** Convert a function or constructor type into a function type. */
export type AsFunction<TFunc extends AnyMockable> = TFunc extends AnyConstructor
  ? ConstructorImplementation<TFunc>
  : TFunc extends AnyFunction
    ? TFunc
    : never

/** Acceptable implementation signatures for a constructor */
export type ConstructorImplementation<
  TFunc extends AnyConstructor = AnyConstructor,
> =
  | (new (...args: ConstructorParameters<TFunc>) => InstanceType<TFunc>)
  | ((this: InstanceType<TFunc>, ...args: ConstructorParameters<TFunc>) => void)

/** Accept a value or an AsymmetricMatcher in an arguments array */
export type WithMatchers<T extends unknown[]> = {
  [K in keyof T]: AsymmetricMatcher<unknown> | T[K]
}

/** A mocked function or constructor. */
export type Mock<TFunc extends AnyMockable> = TFunc extends AnyConstructor
  ? MockedClass<TFunc>
  : TFunc extends AnyFunction
    ? MockedFunction<TFunc>
    : never
