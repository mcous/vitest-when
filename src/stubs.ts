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
  const spy = validateSpy<TFunc>(maybeSpy)
  const existingBehaviors = getBehaviorStack(spy)

  if (existingBehaviors) {
    return existingBehaviors
  }

  const behaviors = createBehaviorStack<TFunc>()
  const fallbackImplementation = spy.getMockImplementation()

  const implementation = (...args: Parameters<TFunc>) => {
    const behavior = behaviors.use(args)?.behavior ?? {
      type: BehaviorType.DO,
      callback: fallbackImplementation,
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
        return behavior.callback?.(...args)
      }
    }
  }

  spy.mockImplementation(
    Object.assign(implementation as TFunc, { [BEHAVIORS_KEY]: behaviors }),
  )

  return behaviors
}

export const validateSpy = <TFunc extends AnyFunction>(
  maybeSpy: unknown,
): MockInstance<TFunc> => {
  if (
    typeof maybeSpy === 'function' &&
    'mockImplementation' in maybeSpy &&
    typeof maybeSpy.mockImplementation === 'function' &&
    'getMockImplementation' in maybeSpy &&
    typeof maybeSpy.getMockImplementation === 'function' &&
    'getMockName' in maybeSpy &&
    typeof maybeSpy.getMockName === 'function'
  ) {
    return maybeSpy as unknown as MockInstance<TFunc>
  }

  throw new NotAMockFunctionError(maybeSpy)
}

export const getBehaviorStack = <TFunc extends AnyFunction>(
  spy: MockInstance<TFunc>,
): BehaviorStack<TFunc> | undefined => {
  const existingImplementation = spy.getMockImplementation() as
    | WhenStubImplementation<TFunc>
    | TFunc
    | undefined

  return existingImplementation && BEHAVIORS_KEY in existingImplementation
    ? existingImplementation[BEHAVIORS_KEY]
    : undefined
}
