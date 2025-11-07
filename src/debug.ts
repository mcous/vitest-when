import { equals } from '@vitest/expect'
import {
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format'

import type { StubbingPlan } from './behaviors.ts'
import { getBehaviorStack } from './stubs.ts'
import type { MockInstance } from './types.ts'

export interface DebugResult {
  name: string
  description: string
  stubbings: readonly Stubbing[]
  unmatchedCalls: readonly unknown[][]
}

export interface Stubbing {
  args: unknown[]
  plan: StubbingPlan
  values: unknown[]
  calls: unknown[][]
}

export const getDebug = (mock: MockInstance): DebugResult => {
  const name = mock.getMockName()
  const behaviors = getBehaviorStack(mock)
  const unmatchedCalls = behaviors?.getUnmatchedCalls() ?? mock.mock.calls
  const stubbings =
    behaviors?.getAll().map(
      (entry): Stubbing => ({
        args: entry.args,
        plan: entry.options.plan,
        values: entry.values,
        calls: entry.calls,
      }),
    ) ?? []

  const result = { name, stubbings, unmatchedCalls }
  const description = formatDebug(result, mock.mock.calls)

  return { ...result, description }
}

const formatDebug = (
  debug: Omit<DebugResult, 'description'>,
  allCalls: unknown[][],
): string => {
  const { name, stubbings, unmatchedCalls } = debug
  const callCount = stubbings.reduce(
    (result, { calls }) => result + calls.length,
    0,
  )
  const stubbingCount = stubbings.length
  const unmatchedCallCount = unmatchedCalls.length

  return (
    mockDescription(name, stubbingCount, callCount + unmatchedCallCount) +
    stubbingDescription(stubbings) +
    callDescription(
      allCalls,
      stubbings.flatMap((stub) => stub.calls),
    )
  )
}

const mockDescription = (
  name: string,
  stubbingCount: number,
  callCount: number,
) =>
  `\`${name}\` has ${count(stubbingCount, 'stubbing')} with ${count(callCount, 'call')}.`

const stubbingDescription = (stubs: readonly Stubbing[]) => {
  if (stubs.length === 0) return ''

  return (
    `\n\nStubbings:\n` +
    stubs
      .map(
        (stub) =>
          `  - ${formatCall(stub.args)}, then ${planFor(stub.plan)} ${formatValues(stub.values)}`,
      )
      .join('\n')
  )
}

const callDescription = (
  allCalls: unknown[][],
  satisfiedCalls: unknown[][],
) => {
  if (allCalls.length === 0) return ''

  const callWasSatisfied = (call: unknown[]) =>
    satisfiedCalls.some((satisfiedCall) => equals(satisfiedCall, call))

  return (
    `\n\n${count(allCalls.length, 'call')}:\n` +
    allCalls
      .map((call) => {
        return `  ${callWasSatisfied(call) ? '✔' : '-'} ${formatCall(call)}`
      })
      .join('\n')
  )
}

const formatCall = (args: readonly unknown[]): string => {
  return `(${args.map((a) => stringify(a)).join(', ')})`
}

const formatValues = (values: readonly unknown[]): string => {
  return stringifyValues(values, ', then ', '`')
}

const planFor = (plan: StubbingPlan): string => {
  switch (plan) {
    case 'thenReturn': {
      return 'return'
    }
    case 'thenResolve': {
      return 'resolve'
    }
    case 'thenThrow': {
      return 'throw'
    }
    case 'thenReject': {
      return 'reject'
    }
    default: {
      return 'return'
    }
  }
}

const count = (amount: number, thing: string) =>
  `${amount} ${thing}${amount === 1 ? '' : 's'}`

const stringifyValues = (
  values: readonly unknown[],
  joiner = ', ',
  wrapper = '',
) => {
  return values
    .map((value) => `${wrapper}${stringify(value)}${wrapper}`)
    .join(joiner)
}

const {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormatPlugins

const FORMAT_PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
]

const FORMAT_MAX_LENGTH = 10_000

/**
 * Stringify a value.
 *
 * Copied from `jest-matcher-utils`
 * https://github.com/jestjs/jest/blob/654dbd6f6b3d94c604221e1afd70fcfb66f9478e/packages/jest-matcher-utils/src/index.ts#L96
 */
const stringify = (object: unknown, maxDepth = 10, maxWidth = 10): string => {
  let result

  try {
    result = prettyFormat(object, {
      maxDepth,
      maxWidth,
      min: true,
      plugins: FORMAT_PLUGINS,
    })
  } catch {
    result = prettyFormat(object, {
      callToJSON: false,
      maxDepth,
      maxWidth,
      min: true,
      plugins: FORMAT_PLUGINS,
    })
  }

  if (result.length >= FORMAT_MAX_LENGTH && maxDepth > 1) {
    return stringify(object, Math.floor(maxDepth / 2), maxWidth)
  } else if (result.length >= FORMAT_MAX_LENGTH && maxWidth > 1) {
    return stringify(object, maxDepth, Math.floor(maxWidth / 2))
  } else {
    return result
  }
}
