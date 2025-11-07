import { equals } from '@vitest/expect'

import type { AnyMockable, ParametersOf, WithMatchers } from './types.ts'

export interface WhenOptions {
  ignoreExtraArgs?: boolean
  times?: number
}

export interface PlanOptions extends WhenOptions {
  plan: StubbingPlan
}

export type StubbingPlan =
  | 'thenDo'
  | 'thenReject'
  | 'thenResolve'
  | 'thenReturn'
  | 'thenThrow'

export interface UseAction {
  callCount: number
  plan: StubbingPlan
  values: unknown[]
}

export interface BehaviorStack<TFunc extends AnyMockable> {
  use: (args: ParametersOf<TFunc>, fallbackValue: unknown) => UseAction

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
        return { callCount: 0, plan: 'thenDo', values: [fallbackValue] }
      }

      behavior.calls.push(args)
      return {
        callCount: behavior.callCount++,
        plan: behavior.options.plan,
        values: behavior.values,
      }
    },

    addStubbing: (args, values, options) => {
      behaviors.unshift({
        args,
        callCount: 0,
        calls: [],
        options,
        values,
      })
    },
  }
}

const behaviorMatches = <TArgs extends unknown[]>(actualArguments: TArgs) => {
  return (behavior: BehaviorEntry<TArgs>): boolean => {
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
