import {
  type BehaviorStack,
  type BehaviorStackOf,
  BehaviorType,
  createBehaviorStack,
} from './behaviors.ts'
import { NotAMockFunctionError } from './errors.ts'
import { getFallbackImplementation } from './fallback-implementation.ts'
import type {
  AsFunction,
  Mock,
  MockSource,
  ParametersOf,
  ReturnTypeOf,
} from './types.ts'

const BEHAVIORS_KEY = Symbol.for('vitest-when:behaviors')

interface WhenStubImplementation<TMock extends Mock> {
  (...args: ParametersOf<TMock>): unknown
  [BEHAVIORS_KEY]: BehaviorStack<ParametersOf<TMock>, ReturnTypeOf<TMock>>
}

export const configureMock = <TMock extends Mock>(
  mock: TMock,
): BehaviorStackOf<TMock> => {
  const existingBehaviorStack = getBehaviorStack(mock)

  if (existingBehaviorStack) {
    return existingBehaviorStack
  }

  const behaviorStack = createBehaviorStack<TMock>()
  const fallbackImplementation = getFallbackImplementation(mock)

  function implementation(this: ThisType<TMock>, ...args: ParametersOf<TMock>) {
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
    Object.assign(implementation, { [BEHAVIORS_KEY]: behaviorStack }),
  )

  return behaviorStack
}

export const validateMock = <TSource extends MockSource>(
  maybeMock: TSource,
): Mock<TSource> => {
  if (
    typeof maybeMock === 'function' &&
    'mockImplementation' in maybeMock &&
    typeof maybeMock.mockImplementation === 'function'
  ) {
    return maybeMock as Mock<TSource>
  }

  throw new NotAMockFunctionError(maybeMock)
}

export const getBehaviorStack = <TMock extends Mock>(
  mock: TMock,
): BehaviorStackOf<TMock> | undefined => {
  const existingImplementation = mock.getMockImplementation() as
    | WhenStubImplementation<TMock>
    | AsFunction<TMock>
    | undefined

  return existingImplementation && BEHAVIORS_KEY in existingImplementation
    ? existingImplementation[BEHAVIORS_KEY]
    : undefined
}
