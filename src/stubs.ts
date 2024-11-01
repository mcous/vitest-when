import {
  createBehaviorStack,
  type BehaviorStack,
  BehaviorType,
} from './behaviors.ts'
import { NotAMockFunctionError } from './errors.ts'
import type { AnyFunction, MockInstance } from './types.ts'

const BEHAVIORS_KEY = Symbol('behaviors')

interface WhenStubImplementation<TFunc extends AnyFunction> {
  (...args: Parameters<TFunc>): unknown
  [BEHAVIORS_KEY]: BehaviorStack<TFunc>
}

export const configureStub = <TFunc extends AnyFunction>(
  maybeSpy: unknown,
): BehaviorStack<TFunc> => {
  const spy = validateSpy(maybeSpy)
  const existingBehaviors = getBehaviorStack(spy)

  if (existingBehaviors) {
    return existingBehaviors
  }

  const behaviors = createBehaviorStack<TFunc>()

  const implementation = (...args: Parameters<TFunc>) => {
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
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
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

export const validateSpy = (maybeSpy: unknown): MockInstance => {
  if (
    maybeSpy &&
    (typeof maybeSpy === 'function' || typeof maybeSpy === 'object') &&
    'mockImplementation' in maybeSpy &&
    typeof maybeSpy.mockImplementation === 'function' &&
    'getMockImplementation' in maybeSpy &&
    typeof maybeSpy.getMockImplementation === 'function' &&
    'getMockName' in maybeSpy &&
    typeof maybeSpy.getMockName === 'function'
  ) {
    return maybeSpy as MockInstance
  }

  throw new NotAMockFunctionError(maybeSpy)
}

export const getBehaviorStack = <TFunc extends AnyFunction>(
  spy: MockInstance,
): BehaviorStack<TFunc> | undefined => {
  const existingImplementation = spy.getMockImplementation() as
    | WhenStubImplementation<TFunc>
    | TFunc
    | undefined

  return existingImplementation && BEHAVIORS_KEY in existingImplementation
    ? existingImplementation[BEHAVIORS_KEY]
    : undefined
}
