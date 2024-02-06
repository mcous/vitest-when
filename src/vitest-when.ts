import { assert } from 'vitest'
import { configureStub } from './stubs.ts'
import type { BehaviorStack, WhenOptions } from './behaviors.ts'
import type { AnyFunction } from './types.ts'

export type { WhenOptions } from './behaviors.ts'
export * from './errors.ts'

export const behaviorStackRegistry = new Set<BehaviorStack<AnyFunction>>()

export interface StubWrapper<TFunc extends AnyFunction> {
  calledWith<TArgs extends Parameters<TFunc>>(
    ...args: TArgs
  ): Stub<TArgs, ReturnType<TFunc>>
}

export interface Stub<TArgs extends unknown[], TReturn> {
  thenReturn: (...values: TReturn[]) => void
  thenResolve: (...values: Awaited<TReturn>[]) => void
  thenThrow: (...errors: unknown[]) => void
  thenReject: (...errors: unknown[]) => void
  thenDo: (...callbacks: ((...args: TArgs) => TReturn)[]) => void
}

export const when = <TFunc extends AnyFunction>(
  spy: TFunc,
  options: WhenOptions = {},
): StubWrapper<TFunc> => {
  const behaviorStack = configureStub(spy)

  behaviorStackRegistry.add(behaviorStack)

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

export const verifyAllWhenMocksCalled = () => {
  const uncalledMocks = [...behaviorStackRegistry].flatMap((behaviorStack) => {
    return behaviorStack.get().filter(behavior => behavior.times && behavior.times > 0)
  })
  assert.equal(uncalledMocks.length,0, `Failed verifyAllWhenMocksCalled: ${uncalledMocks.length} mock(s) not called:`)
}
