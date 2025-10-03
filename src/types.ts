/* eslint-disable @typescript-eslint/no-explicit-any */
/** Common type definitions. */
import type { AsymmetricMatcher } from '@vitest/expect'
import type { MockedClass, MockedFunction } from 'vitest'

/** Any function. */
export type AnyFunction = (...args: any[]) => any

/** Any constructor. */
export type AnyConstructor = new (...args: any[]) => any

/**
 * Minimally typed version of Vitest's `MockInstance`.
 *
 * Ensures backwards compatibility with vitest@<=1
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

/** A function, constructor, or `vi.spyOn` return that's been mocked. */
export type MockSource = AnyFunction | AnyConstructor | MockInstance

/** Extract parameters from either a function or constructor. */
export type ParametersOf<TMock extends MockSource> = TMock extends new (
  ...args: infer P
) => unknown
  ? P
  : TMock extends (...args: infer P) => unknown
    ? P
    : TMock extends MockInstance<(...args: infer P) => unknown>
      ? P
      : never

/** Extract return type from either a function or constructor */
export type ReturnTypeOf<TMock extends MockSource> = TMock extends new (
  ...args: never[]
) => infer R
  ? R
  : TMock extends (...args: any[]) => infer R
    ? R
    : TMock extends MockInstance<(...args: never[]) => infer R>
      ? R
      : never

/** Convert a function or constructor type into a function type. */
export type AsFunction<TMock extends MockSource> = (
  ...args: ParametersOf<TMock>
) => ReturnTypeOf<TMock>

/** Accept a value or an AsymmetricMatcher in an arguments array */
export type WithMatchers<T extends unknown[]> = {
  [K in keyof T]: AsymmetricMatcher<unknown> | T[K]
}

/** A mocked function or constructor. */
export type Mock<TMock extends MockSource = MockSource> =
  TMock extends MockInstance<infer TFunc>
    ? MockedFunction<TFunc>
    : TMock extends AnyFunction
      ? MockedFunction<TMock>
      : TMock extends AnyConstructor
        ? MockedClass<TMock>
        : never
