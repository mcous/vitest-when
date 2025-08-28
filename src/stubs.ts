import {
  type BehaviorStack,
  BehaviorType,
  createBehaviorStack,
} from './behaviors.ts'
import { NotAMockFunctionError } from './errors.ts'
import { getFallbackImplementation } from './fallback-implementation.ts'
import type {
  AnyCallable,
  AnyFunction,
  ExtractParameters,
  MockInstance,
} from './types.ts'

const BEHAVIORS_KEY = Symbol('behaviors')

interface WhenStubImplementation<TFunc extends AnyCallable> {
  (...args: ExtractParameters<TFunc>): unknown
  [BEHAVIORS_KEY]: BehaviorStack<TFunc>
}

export const configureStub = <TFunc extends AnyCallable>(
  maybeSpy: unknown,
): BehaviorStack<TFunc> => {
  const spy = validateSpy<TFunc>(maybeSpy)
  const existingBehaviors = getBehaviorStack(spy)

  if (existingBehaviors) {
    return existingBehaviors
  }

  const behaviors = createBehaviorStack<TFunc>()
  const fallbackImplementation = getFallbackImplementation(spy)

  const implementation = (...args: ExtractParameters<TFunc>) => {
    const behavior = behaviors.use(args)?.behavior ?? {
      type: BehaviorType.DO,
      callback: fallbackImplementation as AnyFunction | undefined,
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

export const validateSpy = <TFunc extends AnyCallable>(
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

export const getBehaviorStack = <TFunc extends AnyCallable>(
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
