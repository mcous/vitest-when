import type { WhenOptions } from './behaviors.ts'
import { type DebugResult, getDebug } from './debug.ts'
import { asMock, configureMock, validateMock } from './stubs.ts'
import type {
  AnyMockable,
  AsFunction,
  Mock,
  MockInstance,
  NormalizeMockable,
  ParametersOf,
  ReturnTypeOf,
  WithMatchers,
} from './types.ts'

export { type Behavior, BehaviorType, type WhenOptions } from './behaviors.ts'
export type { DebugResult, Stubbing } from './debug.ts'
export * from './errors.ts'

export interface StubWrapper<TFunc extends AnyMockable> {
  calledWith<TArgs extends ParametersOf<TFunc>>(
    ...args: WithMatchers<TArgs>
  ): Stub<TFunc>
}

export interface StubWrapperFlexible<TFunc extends AnyMockable> {
  calledWith<TArgs extends ParametersOf<TFunc>>(
    ...args: Partial<WithMatchers<TArgs>>
  ): Stub<TFunc>
}

export interface Stub<TFunc extends AnyMockable> {
  thenReturn: (...values: ReturnTypeOf<TFunc>[]) => Mock<TFunc>
  thenResolve: (...values: Awaited<ReturnTypeOf<TFunc>>[]) => Mock<TFunc>
  thenThrow: (...errors: unknown[]) => Mock<TFunc>
  thenReject: (...errors: unknown[]) => Mock<TFunc>
  thenDo: (...callbacks: AsFunction<TFunc>[]) => Mock<TFunc>
}

export function when<TFunc extends AnyMockable>(
  mock: TFunc | MockInstance<TFunc>,
  options: WhenOptions<true>,
): StubWrapperFlexible<NormalizeMockable<TFunc>>
export function when<TFunc extends AnyMockable>(
  mock: TFunc | MockInstance<TFunc>,
  options?: WhenOptions<false>,
): StubWrapper<NormalizeMockable<TFunc>>
export function when<TFunc extends AnyMockable>(
  mock: TFunc | MockInstance<TFunc>,
  options: WhenOptions = {},
): StubWrapper<NormalizeMockable<TFunc>> {
  const validatedMock = validateMock(mock)
  const behaviorStack = configureMock(validatedMock)
  const result = asMock(validatedMock)

  return {
    calledWith: (...args) => {
      const behaviors = behaviorStack.bindArgs(args, options)

      return {
        thenReturn: (...values) => {
          behaviors.addReturn(values)
          return result
        },
        thenResolve: (...values) => {
          behaviors.addResolve(values)
          return result
        },
        thenThrow: (...errors) => {
          behaviors.addThrow(errors)
          return result
        },
        thenReject: (...errors) => {
          behaviors.addReject(errors)
          return result
        },
        thenDo: (...callbacks) => {
          behaviors.addDo(callbacks)
          return result
        },
      }
    },
  }
}

export interface DebugOptions {
  log?: boolean
}

export const debug = (
  mock: AnyMockable | MockInstance,
  options: DebugOptions = {},
): DebugResult => {
  const log = options.log ?? true
  const validatedMock = validateMock(mock)
  const result = getDebug(validatedMock)

  if (log) {
    console.debug(result.description)
  }

  return result
}
