import type { Mock as Spy } from 'vitest'
import { createBehaviorStack, type BehaviorStack } from './behaviors.ts'
import { NotAMockFunctionError } from './errors.ts'
import type { AnyFunction } from './types.ts'

const BEHAVIORS_KEY = Symbol('behaviors')

interface WhenStubImplementation<TFunc extends AnyFunction> {
  (...args: Parameters<TFunc>): unknown
  [BEHAVIORS_KEY]: BehaviorStack<TFunc>
}

export const configureStub = <TFunc extends AnyFunction>(
  maybeSpy: unknown,
): BehaviorStack<TFunc> => {
  const spy = validateSpy<TFunc>(maybeSpy)
  const existingImplementation = spy.getMockImplementation() as
    | WhenStubImplementation<TFunc>
    | TFunc
    | undefined

  if (existingImplementation && BEHAVIORS_KEY in existingImplementation) {
    return existingImplementation[BEHAVIORS_KEY]
  }

  const behaviors = createBehaviorStack<TFunc>()

  const implementation = (...args: Parameters<TFunc>): unknown => {
    const behavior = behaviors.use(args)

    if (behavior?.throwError) {
      throw behavior.throwError as Error
    }

    if (behavior?.rejectError) {
      return Promise.reject(behavior.rejectError)
    }

    if (behavior?.doCallback) {
      return behavior.doCallback(...args)
    }

    return behavior?.returnValue
  }

  spy.mockImplementation(
    Object.assign(implementation, { [BEHAVIORS_KEY]: behaviors }),
  )

  return behaviors
}

const validateSpy = <TFunc extends AnyFunction>(
  maybeSpy: unknown,
): Spy<Parameters<TFunc>, unknown> => {
  if (
    typeof maybeSpy === 'function' &&
    'mockImplementation' in maybeSpy &&
    typeof maybeSpy.mockImplementation === 'function' &&
    'getMockImplementation' in maybeSpy &&
    typeof maybeSpy.getMockImplementation === 'function'
  ) {
    return maybeSpy as Spy<Parameters<TFunc>, unknown>
  }

  throw new NotAMockFunctionError(maybeSpy)
}
