import { equals } from '@vitest/expect'
import type { AnyFunction } from './types.ts'

export interface WhenOptions {
  times?: number
}

export interface BehaviorStack<TFunc extends AnyFunction> {
  use: (args: Parameters<TFunc>) => BehaviorEntry<Parameters<TFunc>> | undefined

  getAll: () => readonly BehaviorEntry<Parameters<TFunc>>[]

  getUnmatchedCalls: () => readonly Parameters<TFunc>[]

  bindArgs: <TArgs extends Parameters<TFunc>>(
    args: TArgs,
    options: WhenOptions,
  ) => BoundBehaviorStack<ReturnType<TFunc>>
}

export interface BoundBehaviorStack<TReturn> {
  addReturn: (values: TReturn[]) => void
  addResolve: (values: Awaited<TReturn>[]) => void
  addThrow: (values: unknown[]) => void
  addReject: (values: unknown[]) => void
  addDo: (values: AnyFunction[]) => void
}

export interface BehaviorEntry<TArgs extends unknown[]> {
  args: TArgs
  behavior: Behavior
  calls: TArgs[]
  maxCallCount?: number | undefined
}

export type Behavior =
  | { type: 'return'; value: unknown }
  | { type: 'resolve'; value: unknown }
  | { type: 'throw'; error: unknown }
  | { type: 'reject'; error: unknown }
  | { type: 'do'; callback: AnyFunction }

export interface BehaviorOptions<TValue> {
  value: TValue
  maxCallCount: number | undefined
}

export const createBehaviorStack = <
  TFunc extends AnyFunction,
>(): BehaviorStack<TFunc> => {
  const behaviors: BehaviorEntry<Parameters<TFunc>>[] = []
  const unmatchedCalls: Parameters<TFunc>[] = []

  return {
    getAll: () => behaviors,

    getUnmatchedCalls: () => unmatchedCalls,

    use: (args) => {
      const behavior = behaviors
        .filter((b) => behaviorAvailable(b))
        .find(behaviorMatches(args))

      if (!behavior) {
        unmatchedCalls.push(args)
        return undefined
      }

      behavior.calls.push(args)
      return behavior
    },

    bindArgs: (args, options) => ({
      addReturn: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values, options).map(
            ({ value, maxCallCount }) => ({
              args,
              maxCallCount,
              behavior: { type: 'return' as const, value },
              calls: [],
            }),
          ),
        )
      },
      addResolve: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values, options).map(
            ({ value, maxCallCount }) => ({
              args,
              maxCallCount,
              behavior: { type: 'resolve' as const, value },
              calls: [],
            }),
          ),
        )
      },
      addThrow: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values, options).map(
            ({ value, maxCallCount }) => ({
              args,
              maxCallCount,
              behavior: { type: 'throw' as const, error: value },
              calls: [],
            }),
          ),
        )
      },
      addReject: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values, options).map(
            ({ value, maxCallCount }) => ({
              args,
              maxCallCount,
              behavior: { type: 'reject' as const, error: value },
              calls: [],
            }),
          ),
        )
      },
      addDo: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values, options).map(
            ({ value, maxCallCount }) => ({
              args,
              maxCallCount,
              behavior: { type: 'do' as const, callback: value },
              calls: [],
            }),
          ),
        )
      },
    }),
  }
}

const getBehaviorOptions = <TValue>(
  values: TValue[],
  { times }: WhenOptions,
): BehaviorOptions<TValue>[] => {
  if (values.length === 0) {
    values = [undefined as TValue]
  }

  return values.map((value, index) => ({
    value,
    maxCallCount: times ?? (index < values.length - 1 ? 1 : undefined),
  }))
}

const behaviorAvailable = <TArgs extends unknown[]>(
  behavior: BehaviorEntry<TArgs>,
): boolean => {
  return (
    behavior.maxCallCount === undefined ||
    behavior.calls.length < behavior.maxCallCount
  )
}

const behaviorMatches = <TArgs extends unknown[]>(args: TArgs) => {
  return (behavior: BehaviorEntry<TArgs>): boolean => {
    let index = 0

    while (index < args.length || index < behavior.args.length) {
      if (!equals(args[index], behavior.args[index])) {
        return false
      }

      index += 1
    }

    return true
  }
}
