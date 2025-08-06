import type { WhenOptions } from './behaviors.ts'
import { type DebugResult, getDebug } from './debug.ts'
import { configureStub } from './stubs.ts'
import type {
  AnyCallable,
  ExtractParameters,
  ExtractReturnType,
  MockInstance,
  WithMatchers,
} from './types.ts'

export { type Behavior, BehaviorType, type WhenOptions } from './behaviors.ts'
export type { DebugResult, Stubbing } from './debug.ts'
export * from './errors.ts'

export interface StubWrapper<TFunc extends AnyCallable> {
  calledWith<TArgs extends ExtractParameters<TFunc>>(
    ...args: WithMatchers<TArgs>
  ): Stub<TArgs, ExtractReturnType<TFunc>>
}

export interface Stub<TArgs extends unknown[], TReturn> {
  thenReturn: (...values: TReturn[]) => void
  thenResolve: (...values: Awaited<TReturn>[]) => void
  thenThrow: (...errors: unknown[]) => void
  thenReject: (...errors: unknown[]) => void
  thenDo: (...callbacks: ((...args: TArgs) => TReturn)[]) => void
}

export const when = <TFunc extends AnyCallable>(
  spy: TFunc | MockInstance<TFunc>,
  options: WhenOptions = {},
): StubWrapper<TFunc> => {
  const behaviorStack = configureStub(spy)

  return {
    calledWith: (...args) => {
      const behaviors = behaviorStack.bindArgs(args, options)

      return {
        thenReturn: (...values) => behaviors.addReturn(values),
        thenResolve: (...values) => behaviors.addResolve(values),
        thenThrow: (...errors) => behaviors.addThrow(errors),
        thenReject: (...errors) => behaviors.addReject(errors),
        thenDo: (...callbacks) => behaviors.addDo(callbacks),
      }
    },
  }
}

export interface DebugOptions {
  log?: boolean
}

export const debug = <TFunc extends AnyCallable>(
  spy: TFunc | MockInstance<TFunc>,
  options: DebugOptions = {},
): DebugResult => {
  const log = options.log ?? true
  const result = getDebug(spy)

  if (log) {
    console.debug(result.description)
  }

  return result
}
