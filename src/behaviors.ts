import { equals } from '@vitest/expect'

import { concatImpliedCallback, invokeCallbackFor } from './callback.ts'
import type {
  AnyFunction,
  AnyMockable,
  ParametersOf,
  WithMatchers,
} from './types.ts'

export interface WhenOptions {
  ignoreExtraArgs?: boolean
  times?: number
}

export interface PlanOptions extends WhenOptions {
  plan: StubbingPlan
}

export type StubbingPlan =
  | 'thenCallback'
  | 'thenDo'
  | 'thenReject'
  | 'thenResolve'
  | 'thenReturn'
  | 'thenThrow'

export interface UseAction {
  plan: StubbingPlan
  value: unknown
}

export interface BehaviorStack<TFunc extends AnyMockable> {
  use: (args: ParametersOf<TFunc>, fallbackValue?: AnyFunction) => UseAction

  getAll: () => readonly BehaviorEntry<ParametersOf<TFunc>>[]

  getUnmatchedCalls: () => readonly ParametersOf<TFunc>[]

  addStubbing: (
    args: WithMatchers<ParametersOf<TFunc>>,
    values: unknown[],
    options: PlanOptions,
  ) => void
}

export interface BehaviorEntry<
  TArgs extends unknown[] = never[],
  TValue = unknown,
> {
  args: WithMatchers<TArgs>
  calls: TArgs[]
  callCount: number
  options: PlanOptions
  values: TValue[]
}

export const createBehaviorStack = <
  TFunc extends AnyMockable,
>(): BehaviorStack<TFunc> => {
  const behaviors: BehaviorEntry<ParametersOf<TFunc>>[] = []
  const unmatchedCalls: ParametersOf<TFunc>[] = []

  return {
    getAll: () => behaviors,

    getUnmatchedCalls: () => unmatchedCalls,

    use: (args, fallbackValue) => {
      const behavior = behaviors.find(behaviorMatches(args))

      if (!behavior) {
        unmatchedCalls.push(args)
        return { plan: 'thenDo', value: fallbackValue }
      }

      const value = getCurrentStubbedValue(behavior)

      behavior.calls.push(args)
      behavior.callCount++

      invokeCallbackFor(behavior, args)

      return { plan: behavior.options.plan, value }
    },

    addStubbing: (rawArgs, values, options) => {
      const args =
        options.plan === 'thenCallback'
          ? concatImpliedCallback(rawArgs)
          : rawArgs

      behaviors.unshift({ args, callCount: 0, calls: [], options, values })
    },
  }
}

const behaviorMatches = (actualArguments: unknown[]) => {
  return (behavior: BehaviorEntry<unknown[]>): boolean => {
    const { callCount, options } = behavior
    const { times } = options

    // Check whether stubbing has been used too many times
    if (times !== undefined && callCount >= times) return false

    // Check arity
    const expectedArguments = behavior.args
    const { ignoreExtraArgs } = options
    if (expectedArguments.length !== actualArguments.length && !ignoreExtraArgs)
      return false

    // Check arguments
    return expectedArguments.every((expectedArgument, index) => {
      return equals(actualArguments[index], expectedArgument)
    })
  }
}

const getCurrentStubbedValue = (
  behavior: BehaviorEntry<unknown[]>,
): unknown => {
  const { callCount, values } = behavior
  const hasMoreValues = callCount < values.length
  return hasMoreValues ? values[callCount] : values.at(-1)
}
