import { expect } from 'vitest'

import type { BehaviorEntry } from './behaviors.ts'
import type { AnyFunction } from './types.ts'

const CALLBACK_KEY = Symbol.for('vitest-when:callback-args')

export interface WithCallbackMarker {
  [CALLBACK_KEY]: unknown[]
}

declare module 'vitest' {
  interface ExpectStatic {
    callback: (...args: unknown[]) => WithCallbackMarker
  }
}

/**
 * Creates a matcher that matches a callback function. Passing no arguments
 * creates an empty callback matcher, in which case the arguments will be picked
 * up from the call to `.thenCallback()`.
 */
export function createCallbackMatcher(...args: unknown[]) {
  const matcher = expect.any(Function) as WithCallbackMarker
  matcher[CALLBACK_KEY] = args
  return matcher
}

expect.callback = createCallbackMatcher

export function isCallback(value: unknown): value is WithCallbackMarker {
  return (
    typeof value === 'object' &&
    value !== null &&
    CALLBACK_KEY in value &&
    value[CALLBACK_KEY] !== undefined
  )
}

/**
 * Append an empty callback matcher if one isn't already present.
 */
export function concatImpliedCallback<TArgs extends unknown[]>(
  args: TArgs,
): TArgs {
  const callbackArguments = args.filter(isCallback)

  // The user didn't provide a callback matcher, so we'll add one
  if (callbackArguments.length === 0)
    return [...args, expect.callback()] as TArgs

  // The user provided one or more callback matchers, and at least one of them
  // is the special empty one.
  for (const callbackArgument of callbackArguments) {
    const stubbedArgs = callbackArgument[CALLBACK_KEY]
    if (stubbedArgs.length === 0) return args
  }

  // The user provided one or more callback matchers, but none of them are the
  // special empty one, so we'll add one.
  return [...args, expect.callback()] as TArgs
}

/**
 * Invokes any callbacks that were stubbed for the given behavior.
 */
export const invokeCallbackFor = (
  behavior: BehaviorEntry<unknown[]>,
  actualArguments: unknown[],
) => {
  for (const [index, expectedArgument] of behavior.args.entries()) {
    if (!isCallback(expectedArgument)) continue

    // Callback here is guaranteed to be a function due to the matcher
    // validation in `createCallbackMatcher()`, so we can cast it as such.
    const callback = actualArguments[index] as AnyFunction

    // If this is the empty callback matcher, then we'll use the values passed
    // to `.thenCallback()` as the arguments.
    const callbackArguments =
      expectedArgument[CALLBACK_KEY].length === 0
        ? behavior.values
        : expectedArgument[CALLBACK_KEY]

    // Defer the callback to the next tick to ensure correct async behavior as
    // well as protect the core from any userland errors.
    setImmediate(callback, ...callbackArguments)
  }
}

/**
 * Returns a Promise that resolves on the next tick. When testing callbacks, all
 * invoked callbacks are deferred until the next tick, so you must `await
 * nextTick()` before asserting on the callback arguments.
 */
export const nextTick = () =>
  new Promise<void>((resolve) => setImmediate(resolve))
