import type { WhenOptions } from './behaviors.ts'
import { type DebugResult, getDebug } from './debug.ts'
import { configureMock, validateMock } from './stubs.ts'
import type {
  AnyCallable,
  AsFunction,
  Mock,
  ParametersOf,
  ReturnTypeOf,
  WithMatchers,
} from './types.ts'

export { type Behavior, BehaviorType, type WhenOptions } from './behaviors.ts'
export type { DebugResult, Stubbing } from './debug.ts'
export * from './errors.ts'

export interface StubWrapper<TFunc extends AnyCallable> {
  calledWith<TArgs extends ParametersOf<TFunc>>(
    ...args: WithMatchers<TArgs>
  ): Stub<TFunc>
}

export interface Stub<TFunc extends AnyCallable> {
  thenReturn: (...values: ReturnTypeOf<TFunc>[]) => Mock<TFunc>
  thenResolve: (...values: Awaited<ReturnTypeOf<TFunc>>[]) => Mock<TFunc>
  thenThrow: (...errors: unknown[]) => Mock<TFunc>
  thenReject: (...errors: unknown[]) => Mock<TFunc>
  thenDo: (...callbacks: AsFunction<TFunc>[]) => Mock<TFunc>
}

export const when = <TFunc extends AnyCallable>(
  mock: TFunc | Mock<TFunc>,
  options: WhenOptions = {},
): StubWrapper<TFunc> => {
  const validatedMock = validateMock(mock)
  const behaviorStack = configureMock(validatedMock)

  return {
    calledWith: (...args) => {
      const behaviors = behaviorStack.bindArgs(args, options)

      return {
        thenReturn: (...values) => {
          behaviors.addReturn(values)
          return validatedMock
        },
        thenResolve: (...values) => {
          behaviors.addResolve(values)
          return validatedMock
        },
        thenThrow: (...errors) => {
          behaviors.addThrow(errors)
          return validatedMock
        },
        thenReject: (...errors) => {
          behaviors.addReject(errors)
          return validatedMock
        },
        thenDo: (...callbacks) => {
          behaviors.addDo(callbacks)
          return validatedMock
        },
      }
    },
  }
}

export interface DebugOptions {
  log?: boolean
}

export const debug = <TFunc extends AnyCallable>(
  mock: TFunc | Mock<TFunc>,
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
