import type { WhenOptions } from './behaviors.ts'
import { type DebugResult, getDebug } from './debug.ts'
import { configureMock, validateMock } from './stubs.ts'
import type {
  AsFunction,
  Mock,
  MockSource,
  ParametersOf,
  ReturnTypeOf,
  WithMatchers,
} from './types.ts'

export { type Behavior, BehaviorType, type WhenOptions } from './behaviors.ts'
export type { DebugResult, Stubbing } from './debug.ts'
export * from './errors.ts'

export interface StubWrapper<TMock extends Mock> {
  calledWith<TArgs extends ParametersOf<TMock>>(
    ...args: WithMatchers<TArgs>
  ): Stub<TMock>
}

export interface Stub<TMock extends Mock> {
  thenReturn: (...values: ReturnTypeOf<TMock>[]) => TMock
  thenResolve: (...values: Awaited<ReturnTypeOf<TMock>>[]) => TMock
  thenThrow: (...errors: unknown[]) => TMock
  thenReject: (...errors: unknown[]) => TMock
  thenDo: (...callbacks: AsFunction<TMock>[]) => TMock
}

export const when = <TMockSource extends MockSource>(
  mock: TMockSource,
  options: WhenOptions = {},
): StubWrapper<Mock<TMockSource>> => {
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

export const debug = (
  mock: MockSource,
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
