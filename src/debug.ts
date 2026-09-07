import { stringify as prettyStringify } from '@vitest/utils/display'

import { type Behavior, BehaviorType } from './behaviors.ts'
import { getBehaviorStack } from './stubs.ts'
import type { MockInstance } from './types.ts'

export interface DebugResult {
  name: string
  description: string
  stubbings: readonly Stubbing[]
  unmatchedCalls: readonly unknown[][]
}

export interface Stubbing {
  args: readonly unknown[]
  behavior: Behavior
  calls: readonly unknown[][]
}

export const getDebug = (mock: MockInstance): DebugResult => {
  const name = mock.getMockName()
  const behaviors = getBehaviorStack(mock)
  const unmatchedCalls = behaviors?.getUnmatchedCalls() ?? mock.mock.calls
  const stubbings =
    behaviors?.getAll().map((entry) => ({
      args: entry.args,
      behavior: entry.behavior,
      calls: entry.calls,
    })) ?? []

  const result = { name, stubbings, unmatchedCalls }
  const description = formatDebug(result)

  return { ...result, description }
}

const formatDebug = (debug: Omit<DebugResult, 'description'>): string => {
  const { name, stubbings, unmatchedCalls } = debug
  const callCount = stubbings.reduce(
    (result, { calls }) => result + calls.length,
    0,
  )
  const stubbingCount = stubbings.length
  const unmatchedCallsCount = unmatchedCalls.length

  return [
    `\`${name}()\` has:`,
    `* ${count(stubbingCount, 'stubbing')} with ${count(callCount, 'call')}`,
    ...stubbings.map((stubbing) => `  * ${formatStubbing(stubbing)}`).reverse(),
    `* ${count(unmatchedCallsCount, 'unmatched call')}`,
    ...unmatchedCalls.map((args) => `  * \`${formatCall(args)}\``),
    '',
  ].join('\n')
}

const formatStubbing = ({ args, behavior, calls }: Stubbing): string => {
  return `Called ${count(calls.length, 'time')}: \`${formatCall(
    args,
  )} ${formatBehavior(behavior)}\``
}

const formatCall = (args: readonly unknown[]): string => {
  return `(${args.map((a) => stringify(a)).join(', ')})`
}

const formatBehavior = (behavior: Behavior): string => {
  switch (behavior.type) {
    case BehaviorType.RETURN: {
      return `=> ${stringify(behavior.value)}`
    }

    case BehaviorType.RESOLVE: {
      return `=> Promise.resolve(${stringify(behavior.value)})`
    }

    case BehaviorType.THROW: {
      return `=> { throw ${stringify(behavior.error)} }`
    }

    case BehaviorType.REJECT: {
      return `=> Promise.reject(${stringify(behavior.error)})`
    }

    case BehaviorType.DO: {
      return `=> ${stringify(behavior.callback)}()`
    }
  }
}

const count = (amount: number, thing: string) =>
  `${amount} ${thing}${amount === 1 ? '' : 's'}`

const STRINGIFY_OPTIONS = { min: true, maxWidth: 10 } as const

/** Stringify a value for display in debug output. */
const stringify = (object: unknown): string =>
  prettyStringify(object, 10, STRINGIFY_OPTIONS)
