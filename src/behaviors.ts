import { equals } from '@vitest/expect'
import type { AnyFunction } from './types.ts'

export const ONCE = Symbol('ONCE')

export type StubValue<TValue> = TValue | typeof ONCE

export interface BehaviorStack<TFunc extends AnyFunction> {
  use: (args: Parameters<TFunc>) => BehaviorEntry<Parameters<TFunc>> | undefined

  bindArgs: <TArgs extends Parameters<TFunc>>(
    args: TArgs,
  ) => BoundBehaviorStack<ReturnType<TFunc>>
}

export interface BoundBehaviorStack<TReturn> {
  addReturn: (values: StubValue<TReturn>[]) => void
  addResolve: (values: StubValue<Awaited<TReturn>>[]) => void
  addThrow: (values: StubValue<unknown>[]) => void
  addReject: (values: StubValue<unknown>[]) => void
  addDo: (values: StubValue<AnyFunction>[]) => void
}

export interface BehaviorEntry<TArgs extends unknown[]> {
  args: TArgs
  returnValue?: unknown
  throwError?: unknown
  doCallback?: AnyFunction | undefined
  times?: number | undefined
}

export interface BehaviorOptions<TValue> {
  value: TValue
  times: number | undefined
}

export const createBehaviorStack = <
  TFunc extends AnyFunction,
>(): BehaviorStack<TFunc> => {
  const behaviors: BehaviorEntry<Parameters<TFunc>>[] = []

  return {
    use: (args) => {
      const behavior = behaviors
        .filter((b) => behaviorAvailable(b))
        .find(behaviorMatches(args))

      if (behavior?.times !== undefined) {
        behavior.times -= 1
      }

      return behavior
    },

    bindArgs: (args) => ({
      addReturn: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values).map(({ value, times }) => ({
            args,
            times,
            returnValue: value,
          })),
        )
      },
      addResolve: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values).map(({ value, times }) => ({
            args,
            times,
            returnValue: Promise.resolve(value),
          })),
        )
      },
      addThrow: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values).map(({ value, times }) => ({
            args,
            times,
            throwError: value,
          })),
        )
      },
      addReject: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values).map(({ value, times }) => ({
            args,
            times,
            returnValue: Promise.reject(value),
          })),
        )
      },
      addDo: (values) => {
        behaviors.unshift(
          ...getBehaviorOptions(values).map(({ value, times }) => ({
            args,
            times,
            doCallback: value,
          })),
        )
      },
    }),
  }
}

const getBehaviorOptions = <TValue>(
  valuesAndOptions: StubValue<TValue>[],
): BehaviorOptions<TValue>[] => {
  const once = valuesAndOptions.includes(ONCE)
  let values = valuesAndOptions.filter((value) => value !== ONCE) as TValue[]

  if (values.length === 0) {
    values = [undefined as TValue]
  }

  return values.map((value, index) => ({
    value,
    times: once || index < values.length - 1 ? 1 : undefined,
  }))
}

const behaviorAvailable = <TArgs extends unknown[]>(
  behavior: BehaviorEntry<TArgs>,
): boolean => {
  return behavior.times === undefined || behavior.times > 0
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
