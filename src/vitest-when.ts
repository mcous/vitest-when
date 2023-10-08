import { configureStub } from './stubs.ts'
import type { StubValue } from './behaviors.ts'
import type { AnyFunction } from './types.ts'

export { ONCE, type StubValue } from './behaviors.ts'
export * from './errors.ts'

export interface StubWrapper<TFunc extends AnyFunction> {
  calledWith<TArgs extends Parameters<TFunc>>(
    ...args: TArgs
  ): Stub<TArgs, ReturnType<TFunc>>
}

export interface Stub<TArgs extends unknown[], TReturn> {
  thenReturn: (...values: StubValue<TReturn>[]) => void
  thenResolve: (...values: StubValue<Awaited<TReturn>>[]) => void
  thenThrow: (...errors: StubValue<unknown>[]) => void
  thenReject: (...errors: StubValue<unknown>[]) => void
  thenDo: (...callbacks: StubValue<(...args: TArgs) => TReturn>[]) => void
}

export const when = <TFunc extends AnyFunction>(
  spy: TFunc,
): StubWrapper<TFunc> => {
  const behaviorStack = configureStub(spy)

  return {
    calledWith: (...args) => {
      const boundBehaviors = behaviorStack.bindArgs(args)

      return {
        thenReturn: (...values) => boundBehaviors.addReturn(values),
        thenResolve: (...values) => boundBehaviors.addResolve(values),
        thenThrow: (...errors) => boundBehaviors.addThrow(errors),
        thenReject: (...errors) => boundBehaviors.addReject(errors),
        thenDo: (...callbacks) => boundBehaviors.addDo(callbacks),
      }
    },
  }
}
