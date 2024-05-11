import { type Mock as Spy } from 'vitest'
import {
  createBehaviorStack,
  type BehaviorStack,
  BehaviorType,
} from './behaviors.ts'
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
  const existingBehaviors = getBehaviorStack(spy)

  if (existingBehaviors) {
    return existingBehaviors
  }

  const behaviors = createBehaviorStack<TFunc>()

  const implementation = (...args: Parameters<TFunc>): unknown => {
    const behavior = behaviors.use(args)?.behavior ?? {
      type: BehaviorType.RETURN,
      value: undefined,
    }

    switch (behavior.type) {
      case BehaviorType.RETURN: {
        return behavior.value
      }

      case BehaviorType.RESOLVE: {
        return Promise.resolve(behavior.value)
      }

      case BehaviorType.THROW: {
        throw behavior.error
      }

      case BehaviorType.REJECT: {
        return Promise.reject(behavior.error)
      }

      case BehaviorType.DO: {
        return behavior.callback(...args)
      }
    }
  }

  spy.mockImplementation(
    Object.assign(implementation, { [BEHAVIORS_KEY]: behaviors }),
  )

  return behaviors
}

export const validateSpy = <TFunc extends AnyFunction>(
  maybeSpy: unknown,
): Spy<Parameters<TFunc>, unknown> => {
  if (
    typeof maybeSpy === 'function' &&
    'mockImplementation' in maybeSpy &&
    typeof maybeSpy.mockImplementation === 'function' &&
    'getMockImplementation' in maybeSpy &&
    typeof maybeSpy.getMockImplementation === 'function' &&
    'getMockName' in maybeSpy &&
    typeof maybeSpy.getMockName === 'function'
  ) {
    return maybeSpy as Spy<Parameters<TFunc>, unknown>
  }

  throw new NotAMockFunctionError(maybeSpy)
}

export const getBehaviorStack = <TFunc extends AnyFunction>(
  spy: Spy,
): BehaviorStack<TFunc> | undefined => {
  const existingImplementation = spy.getMockImplementation() as
    | WhenStubImplementation<TFunc>
    | TFunc
    | undefined

  return existingImplementation && BEHAVIORS_KEY in existingImplementation
    ? existingImplementation[BEHAVIORS_KEY]
    : undefined
}
