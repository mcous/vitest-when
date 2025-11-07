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

export type { WhenOptions } from './behaviors.ts'
export type { DebugResult, Stubbing } from './debug.ts'
export * from './errors.ts'

export interface StubWrapper<TFunc extends AnyMockable> {
  calledWith<TArgs extends ParametersOf<TFunc>>(
    ...args: WithMatchers<TArgs>
  ): Stub<TFunc>
}

export interface Stub<TFunc extends AnyMockable> {
  thenReturn: (...values: ReturnTypeOf<TFunc>[]) => Mock<TFunc>
  thenResolve: (...values: Awaited<ReturnTypeOf<TFunc>>[]) => Mock<TFunc>
  thenThrow: (...errors: unknown[]) => Mock<TFunc>
  thenReject: (...errors: unknown[]) => Mock<TFunc>
  thenDo: (...callbacks: AsFunction<TFunc>[]) => Mock<TFunc>
}

export const when = <TFunc extends AnyMockable>(
  mock: TFunc | MockInstance<TFunc>,
  options: WhenOptions = {},
): StubWrapper<NormalizeMockable<TFunc>> => {
  const validatedMock = validateMock(mock)
  const behaviorStack = configureMock(validatedMock)
  const result = asMock(validatedMock)

  return {
    calledWith: (...args) => {
      return {
        thenReturn: (...values) => {
          behaviorStack.addStubbing(args, values, {
            ...options,
            plan: 'thenReturn',
          })
          return result
        },
        thenResolve: (...values) => {
          behaviorStack.addStubbing(args, values, {
            ...options,
            plan: 'thenResolve',
          })
          return result
        },
        thenThrow: (...errors) => {
          behaviorStack.addStubbing(args, errors, {
            ...options,
            plan: 'thenThrow',
          })
          return result
        },
        thenReject: (...errors) => {
          behaviorStack.addStubbing(args, errors, {
            ...options,
            plan: 'thenReject',
          })
          return result
        },
        thenDo: (...callbacks) => {
          behaviorStack.addStubbing(args, callbacks, {
            ...options,
            plan: 'thenDo',
          })
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
