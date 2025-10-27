import {
  type BehaviorStack,
  BehaviorType,
  createBehaviorStack,
} from './behaviors.ts'
import { NotAMockFunctionError } from './errors.ts'
import { getFallbackImplementation } from './fallback-implementation.ts'
import type {
  AnyMockable,
  AsFunction,
  Mock,
  MockInstance,
  NormalizeMockable,
  ParametersOf,
} from './types.ts'

const BEHAVIORS_KEY = Symbol.for('vitest-when:behaviors')

interface WhenStubImplementation<TFunc extends AnyMockable> {
  (...args: ParametersOf<TFunc>): unknown
  [BEHAVIORS_KEY]: BehaviorStack<TFunc>
}

export const configureMock = <TFunc extends AnyMockable>(
  mock: MockInstance<TFunc>,
): BehaviorStack<TFunc> => {
  const existingBehaviorStack = getBehaviorStack(mock)

  if (existingBehaviorStack) {
    return existingBehaviorStack
  }

  const behaviorStack = createBehaviorStack<TFunc>()
  const fallbackImplementation = getFallbackImplementation(mock)

  function implementation(this: ThisType<TFunc>, ...args: ParametersOf<TFunc>) {
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return behavior.callback?.call(this, ...args)
      }
    }
  }

  mock.mockImplementation(
    Object.assign(implementation, {
      [BEHAVIORS_KEY]: behaviorStack,
    }) as unknown as AsFunction<TFunc>,
  )

  return behaviorStack
}

export const validateMock = <TFunc extends AnyMockable>(
  maybeMock: TFunc | MockInstance<TFunc>,
): MockInstance<NormalizeMockable<TFunc>> => {
  if (
    typeof maybeMock === 'function' &&
    'mockImplementation' in maybeMock &&
    typeof maybeMock.mockImplementation === 'function'
  ) {
    return maybeMock as unknown as MockInstance<NormalizeMockable<TFunc>>
  }

  throw new NotAMockFunctionError(maybeMock)
}

export const getBehaviorStack = <TFunc extends AnyMockable>(
  mock: MockInstance<TFunc>,
): BehaviorStack<TFunc> | undefined => {
  const existingImplementation = mock.getMockImplementation() as
    | WhenStubImplementation<TFunc>
    | AsFunction<TFunc>
    | undefined

  return existingImplementation && BEHAVIORS_KEY in existingImplementation
    ? existingImplementation[BEHAVIORS_KEY]
    : undefined
}

export const asMock = <TFunc extends AnyMockable>(
  mock: MockInstance<TFunc>,
): Mock<NormalizeMockable<TFunc>> => {
  return mock as unknown as Mock<NormalizeMockable<TFunc>>
}
