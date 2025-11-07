import { type BehaviorStack, createBehaviorStack } from './behaviors.ts'
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

  function implementation(
    this: ThisType<TFunc>,
    ...args: ParametersOf<TFunc>
  ): unknown {
    const { plan, value } = behaviorStack.use(args, fallbackImplementation)

    switch (plan) {
      case 'thenReturn': {
        return value
      }
      case 'thenThrow': {
        throw value
      }
      case 'thenResolve': {
        return Promise.resolve(value)
      }
      case 'thenReject': {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(value)
      }
      case 'thenDo': {
        return typeof value === 'function'
          ? value.call(this, ...args)
          : undefined
      }
      case 'thenCallback': {
        // Callback is called during `behaviorStack.use()` so there's nothing to
        // do here.
        return undefined
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
