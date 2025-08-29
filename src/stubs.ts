import {
  type BehaviorStack,
  BehaviorType,
  createBehaviorStack,
} from './behaviors.ts'
import { NotAMockFunctionError } from './errors.ts'
import { getFallbackImplementation } from './fallback-implementation.ts'
import type { AnyCallable, Mock, ParametersOf } from './types.ts'

const BEHAVIORS_KEY = Symbol.for('vitest-when:behaviors')

interface WhenStubImplementation<TFunc extends AnyCallable> {
  (...args: ParametersOf<TFunc>): unknown
  [BEHAVIORS_KEY]: BehaviorStack<TFunc>
}

export const configureMock = <TFunc extends AnyCallable>(
  mock: Mock<TFunc>,
): BehaviorStack<TFunc> => {
  const existingBehaviorStack = getBehaviorStack(mock)

  if (existingBehaviorStack) {
    return existingBehaviorStack
  }

  const behaviorStack = createBehaviorStack<TFunc>()
  const fallbackImplementation = getFallbackImplementation(mock)

  const implementation = (...args: ParametersOf<TFunc>) => {
    const behavior = behaviorStack.use(args)?.behavior ?? {
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

  mock.mockImplementation(
    Object.assign(implementation, { [BEHAVIORS_KEY]: behaviorStack }),
  )

  return behaviorStack
}

export const validateMock = <TFunc extends AnyCallable>(
  maybeMock: TFunc | Mock<TFunc>,
): Mock<TFunc> => {
  if (
    typeof maybeMock === 'function' &&
    'mockImplementation' in maybeMock &&
    typeof maybeMock.mockImplementation === 'function'
  ) {
    return maybeMock
  }

  throw new NotAMockFunctionError(maybeMock)
}

export const getBehaviorStack = <TFunc extends AnyCallable>(
  mock: Mock<TFunc>,
): BehaviorStack<TFunc> | undefined => {
  const existingImplementation = mock.getMockImplementation() as
    | WhenStubImplementation<TFunc>
    | TFunc
    | undefined

  return existingImplementation && BEHAVIORS_KEY in existingImplementation
    ? existingImplementation[BEHAVIORS_KEY]
    : undefined
}
