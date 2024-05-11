import {
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format'

import { validateSpy, getBehaviorStack } from './stubs'
import type { AnyFunction } from './types'
import type { Behavior } from './behaviors'

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

export const getDebug = <TFunc extends AnyFunction>(
  spy: TFunc,
): DebugResult => {
  const target = validateSpy<TFunc>(spy)
  const name = target.getMockName()
  const behaviors = getBehaviorStack<TFunc>(target)
  const unmatchedCalls = behaviors?.getUnmatchedCalls() ?? target.mock.calls
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
    case 'return': {
      return `=> ${stringify(behavior.value)}`
    }

    case 'resolve': {
      return `=> Promise.resolve(${stringify(behavior.value)})`
    }

    case 'throw': {
      return `=> { throw ${stringify(behavior.error)} }`
    }

    case 'reject': {
      return `=> Promise.reject(${stringify(behavior.error)})`
    }

    case 'do': {
      return `=> ${stringify(behavior.callback)}()`
    }
  }
}

const count = (amount: number, thing: string) =>
  `${amount} ${thing}${amount === 1 ? '' : 's'}`

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
