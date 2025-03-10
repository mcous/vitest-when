# vitest-when

[![npm badge][]][npm]
[![ci badge][]][ci]
[![coverage badge][]][coverage]

Read the introductory post: [Better mocks in Vitest][better-mocks]

Stub behaviors of [Vitest][] mock functions with a small, readable API. Inspired by [testdouble.js][] and [jest-when][].

```shell
npm install --save-dev vitest-when
```

[better-mocks]: https://michael.cousins.io/articles/2023-06-30-better-stubs/
[vitest]: https://vitest.dev/
[testdouble.js]: https://github.com/testdouble/testdouble.js/
[jest-when]: https://github.com/timkindberg/jest-when
[npm]: https://npmjs.org/vitest-when
[npm badge]: https://img.shields.io/npm/v/vitest-when.svg?style=flat-square
[ci]: https://github.com/mcous/vitest-when/actions
[ci badge]: https://img.shields.io/github/actions/workflow/status/mcous/vitest-when/ci.yaml?style=flat-square
[coverage]: https://coveralls.io/github/mcous/vitest-when
[coverage badge]: https://img.shields.io/coverallsCoverage/github/mcous/vitest-when?style=flat-square

## Usage

Create [stubs][] - fake objects that have pre-configured responses to matching arguments - from [Vitest's mock functions][]. With vitest-when, your stubs are:

- Easy to read
- Hard to misconfigure, especially when using TypeScript

Wrap your `vi.fn()` mock - or a function imported from a `vi.mock`'d module - in [`when`][when], match on a set of arguments using [`calledWith`][called-with], and configure a behavior

- [`.thenReturn()`][then-return] - Return a value
- [`.thenResolve()`][then-resolve] - Resolve a `Promise`
- [`.thenThrow()`][then-throw] - Throw an error
- [`.thenReject()`][then-reject] - Reject a `Promise`
- [`.thenDo()`][then-do] - Trigger a function

If the stub is called with arguments that match `calledWith`, the configured behavior will occur. If the arguments do not match, the stub will no-op and return `undefined`.

```ts
import { vi, test, afterEach } from 'vitest'
import { when } from 'vitest-when'

afterEach(() => {
  vi.resetAllMocks()
})

test('stubbing with vitest-when', () => {
  const stub = vi.fn()

  when(stub).calledWith(1, 2, 3).thenReturn(4)
  when(stub).calledWith(4, 5, 6).thenReturn(7)

  let result = stub(1, 2, 3)
  expect(result).toBe(4)

  result = stub(4, 5, 6)
  expect(result).toBe(7)

  result = stub(7, 8, 9)
  expect(result).toBe(undefined)
})
```

You should call `vi.resetAllMocks()` in your suite's `afterEach` hook to remove the implementation added by `when`. You can also set Vitest's [`mockReset`](https://vitest.dev/config/#mockreset) config to `true` instead of using `afterEach`.

[vitest's mock functions]: https://vitest.dev/api/mock.html
[stubs]: https://en.wikipedia.org/wiki/Test_stub
[when]: #whenspy-tfunc-stubwrappertfunc
[called-with]: #calledwithargs-targs-stubtargs-treturn
[then-return]: #thenreturnvalue-treturn
[then-resolve]: #thenresolvevalue-treturn
[then-throw]: #thenthrowerror-unknown
[then-reject]: #thenrejecterror-unknown
[then-do]: #thendocallback-args-targs--treturn

### Why not vanilla Vitest mocks?

Vitest's mock functions are powerful, but have an overly permissive API, inherited from Jest. Vanilla `vi.fn()` mock functions are difficult to use well and easy to use poorly.

- Mock usage is spread across the [arrange and assert][] phases of your test, with "act" in between, making the test harder to read.
- If you forget the `expect(...).toHaveBeenCalledWith(...)` step, the test will pass even if the mock is called incorrectly.
- `expect(...).toHaveBeenCalledWith(...)` is not type-checked, as of Vitest `0.31.0`.

```ts
// arrange
const stub = vi.fn()
stub.mockReturnValue('world')

// act
const result = stub('hello')

// assert
expect(stub).toHaveBeenCalledWith('hello')
expect(result).toBe('world')
```

In contrast, when using vitest-when stubs:

- All stub configuration happens in the "arrange" phase of your test.
- You cannot forget `calledWith`.
- `calledWith` and `thenReturn` (et. al.) are fully type-checked.

```ts
// arrange
const stub = vi.fn()
when(stub).calledWith('hello').thenReturn('world')

// act
const result = stub('hello')

// assert
expect(result).toBe('world')
```

[arrange and assert]: https://github.com/testdouble/contributing-tests/wiki/Arrange-Act-Assert

### Example

See the [./example](./example) directory for example usage.

```ts
// meaning-of-life.test.ts
import { vi, describe, afterEach, it, expect } from 'vitest'
import { when } from 'vitest-when'

import * as deepThought from './deep-thought.ts'
import * as earth from './earth.ts'
import * as subject from './meaning-of-life.ts'

vi.mock('./deep-thought.ts')
vi.mock('./earth.ts')

describe('get the meaning of life', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should get the answer and the question', async () => {
    when(deepThought.calculateAnswer).calledWith().thenResolve(42)
    when(earth.calculateQuestion).calledWith(42).thenResolve("What's 6 by 9?")

    const result = await subject.createMeaning()

    expect(result).toEqual({ question: "What's 6 by 9?", answer: 42 })
  })
})
```

```ts
// meaning-of-life.ts
import { calculateAnswer } from './deep-thought.ts'
import { calculateQuestion } from './earth.ts'

export interface Meaning {
  question: string
  answer: number
}

export const createMeaning = async (): Promise<Meaning> => {
  const answer = await calculateAnswer()
  const question = await calculateQuestion(answer)

  return { question, answer }
}
```

```ts
// deep-thought.ts
export const calculateAnswer = async (): Promise<number> => {
  throw new Error(`calculateAnswer() not implemented`)
}
```

```ts
// earth.ts
export const calculateQuestion = async (answer: number): Promise<string> => {
  throw new Error(`calculateQuestion(${answer}) not implemented`)
}
```

## API

### `when(spy: TFunc, options?: WhenOptions): StubWrapper<TFunc>`

Configures a `vi.fn()` or `vi.spyOn()` mock function to act as a vitest-when stub. Adds an implementation to the function that initially no-ops, and returns an API to configure behaviors for given arguments using [`.calledWith(...)`][called-with]

```ts
import { vi } from 'vitest'
import { when } from 'vitest-when'

const spy = vi.fn()

when(spy)

expect(spy()).toBe(undefined)
```

#### Options

```ts
import type { WhenOptions } from 'vitest-when'
```

| option  | default | type    | description                                        |
| ------- | ------- | ------- | -------------------------------------------------- |
| `times` | N/A     | integer | Only trigger configured behavior a number of times |

### `.calledWith(...args: TArgs): Stub<TArgs, TReturn>`

Create a stub that matches a given set of arguments which you can configure with different behaviors using methods like [`.thenReturn(...)`][then-return].

```ts
const spy = vi.fn()

when(spy).calledWith('hello').thenReturn('world')

expect(spy('hello')).toEqual('world')
```

When a call to a mock uses arguments that match those given to `calledWith`, a configured behavior will be triggered. All arguments must match, but you can use Vitest's [asymmetric matchers][] to loosen the stubbing:

```ts
const spy = vi.fn()

when(spy).calledWith(expect.any(String)).thenReturn('world')

expect(spy('hello')).toEqual('world')
expect(spy('anything')).toEqual('world')
```

If `calledWith` is used multiple times, the last configured stubbing will be used.

```ts
when(spy).calledWith('hello').thenReturn('world')
expect(spy('hello')).toEqual('world')
when(spy).calledWith('hello').thenReturn('goodbye')
expect(spy('hello')).toEqual('goodbye')
```

[asymmetric matchers]: https://vitest.dev/api/expect.html#expect-anything

#### Types of overloaded functions

Due to fundamental limitations in TypeScript, `when()` will always use the _last_ overload to infer function parameters and return types. You can use the `TFunc` type parameter of `when()` to manually select a different overload entry:

```ts
function overloaded(): null
function overloaded(input: number): string
function overloaded(input?: number): string | null {
  // ...
}

// Last entry: all good!
when(overloaded).calledWith(42).thenReturn('hello')

// $ts-expect-error: first entry
when(overloaded).calledWith().thenReturn(null)

// Manually specified: all good!
when<() => null>(overloaded).calledWith().thenReturn(null)
```

#### Fallback

By default, if arguments do not match, a vitest-when stub will no-op and return `undefined`. You can customize this fallback by configuring your own unconditional behavior on the mock using Vitest's built-in [mock API][].

```ts
const spy = vi.fn().mockReturnValue('you messed up!')

when(spy).calledWith('hello').thenReturn('world')

spy('hello') // "world"
spy('jello') // "you messed up!"
```

[mock API]: https://vitest.dev/api/mock.html

### `.thenReturn(value: TReturn)`

When the stubbing is satisfied, return `value`

```ts
const spy = vi.fn()

when(spy).calledWith('hello').thenReturn('world')

expect(spy('hello')).toEqual('world')
```

To only return a value once, use the `times` option.

```ts
import { when } from 'vitest-when'

const spy = vi.fn()

when(spy, { times: 1 }).calledWith('hello').thenReturn('world')

expect(spy('hello')).toEqual('world')
expect(spy('hello')).toEqual(undefined)
```

You may pass several values to `thenReturn` to return different values in succession. If you do not specify `times`, the last value will be latched. Otherwise, each value will be returned the specified number of times.

```ts
const spy = vi.fn()

when(spy).calledWith('hello').thenReturn('hi', 'sup?')

expect(spy('hello')).toEqual('hi')
expect(spy('hello')).toEqual('sup?')
expect(spy('hello')).toEqual('sup?')
```

### `.thenResolve(value: TReturn)`

When the stubbing is satisfied, resolve a `Promise` with `value`

```ts
const spy = vi.fn()

when(spy).calledWith('hello').thenResolve('world')

expect(await spy('hello')).toEqual('world')
```

To only resolve a value once, use the `times` option.

```ts
import { when } from 'vitest-when'

const spy = vi.fn()

when(spy, { times: 1 }).calledWith('hello').thenResolve('world')

expect(await spy('hello')).toEqual('world')
expect(spy('hello')).toEqual(undefined)
```

You may pass several values to `thenResolve` to resolve different values in succession. If you do not specify `times`, the last value will be latched. Otherwise, each value will be resolved the specified number of times.

```ts
const spy = vi.fn()

when(spy).calledWith('hello').thenResolve('hi', 'sup?')

expect(await spy('hello')).toEqual('hi')
expect(await spy('hello')).toEqual('sup?')
expect(await spy('hello')).toEqual('sup?')
```

### `.thenThrow(error: unknown)`

When the stubbing is satisfied, throw `error`.

```ts
const spy = vi.fn()

when(spy).calledWith('hello').thenThrow(new Error('oh no'))

expect(() => spy('hello')).toThrow('oh no')
```

To only throw an error only once, use the `times` option.

```ts
import { when } from 'vitest-when'

const spy = vi.fn()

when(spy, { times: 1 }).calledWith('hello').thenThrow(new Error('oh no'))

expect(() => spy('hello')).toThrow('oh no')
expect(spy('hello')).toEqual(undefined)
```

You may pass several values to `thenThrow` to throw different errors in succession. If you do not specify `times`, the last value will be latched. Otherwise, each error will be thrown the specified number of times.

```ts
const spy = vi.fn()

when(spy)
  .calledWith('hello')
  .thenThrow(new Error('oh no'), new Error('this is bad'))

expect(() => spy('hello')).toThrow('oh no')
expect(() => spy('hello')).toThrow('this is bad')
expect(() => spy('hello')).toThrow('this is bad')
```

### `.thenReject(error: unknown)`

When the stubbing is satisfied, reject a `Promise` with `error`.

```ts
const spy = vi.fn()

when(spy).calledWith('hello').thenReject(new Error('oh no'))

await expect(spy('hello')).rejects.toThrow('oh no')
```

To only throw an error only once, use the `times` option.

```ts
import { times, when } from 'vitest-when'

const spy = vi.fn()

when(spy, { times: 1 }).calledWith('hello').thenReject(new Error('oh no'))

await expect(spy('hello')).rejects.toThrow('oh no')
expect(spy('hello')).toEqual(undefined)
```

You may pass several values to `thenReject` to throw different errors in succession. If you do not specify `times`, the last value will be latched. Otherwise, each rejection will be triggered the specified number of times.

```ts
const spy = vi.fn()

when(spy)
  .calledWith('hello')
  .thenReject(new Error('oh no'), new Error('this is bad'))

await expect(spy('hello')).rejects.toThrow('oh no')
await expect(spy('hello')).rejects.toThrow('this is bad')
await expect(spy('hello')).rejects.toThrow('this is bad')
```

### `.thenDo(callback: (...args: TArgs) => TReturn)`

When the stubbing is satisfied, run `callback` to trigger a side-effect and return its result (if any). `thenDo` is a relatively powerful tool for stubbing complex behaviors, so if you find yourself using `thenDo` often, consider refactoring your code to use more simple interactions! Your future self will thank you.

```ts
const spy = vi.fn()
let called = false

when(spy)
  .calledWith('hello')
  .thenDo(() => {
    called = true
    return 'world'
  })

expect(spy('hello')).toEqual('world')
expect(called).toEqual(true)
```

To only run the callback once, use the `times` option.

```ts
import { times, when } from 'vitest-when'

const spy = vi.fn()

when(spy, { times: 1 })
  .calledWith('hello')
  .thenDo(() => 'world')

expect(spy('hello')).toEqual('world')
expect(spy('hello')).toEqual(undefined)
```

You may pass several callbacks to `thenDo` to trigger different side-effects in succession. If you do not specify `times`, the last callback will be latched. Otherwise, each callback will be triggered the specified number of times.

```ts
const spy = vi.fn()

when(spy)
  .calledWith('hello')
  .thenDo(
    () => 'world',
    () => 'solar system',
  )

expect(spy('hello')).toEqual('world')
expect(spy('hello')).toEqual('solar system')
```

### `debug(spy: TFunc, options?: DebugOptions): DebugResult`

Logs and returns information about a mock's stubbing and usage. Useful if a test with mocks is failing and you can't figure out why.

```ts
import { when, debug } from 'vitest-when'

const coolFunc = vi.fn().mockName('coolFunc')

when(coolFunc).calledWith(1, 2, 3).thenReturn(123)
when(coolFunc).calledWith(4, 5, 6).thenThrow(new Error('oh no'))

const result = coolFunc(1, 2, 4)

debug(coolFunc)
// `coolFunc()` has:
// * 2 stubbings with 0 calls
//   * Called 0 times: `(1, 2, 3) => 123`
//   * Called 0 times: `(4, 5, 6) => { throw [Error: oh no] }`
// * 1 unmatched call
//   * `(1, 2, 4)`
```

#### `DebugOptions`

```ts
import type { DebugOptions } from 'vitest-when'
```

| option | default | type    | description                            |
| ------ | ------- | ------- | -------------------------------------- |
| `log`  | `true`  | boolean | Whether the call to `debug` should log |

#### `DebugResult`

```ts
import type { DebugResult, Stubbing, Behavior } from 'vitest-when'
```

| fields                       | type                                         | description                                                 |
| ---------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `description`                | `string`                                     | A human-readable description of the stub, logged by default |
| `name`                       | `string`                                     | The name of the mock, if set by [`mockName`][mockName]      |
| `stubbings`                  | `Stubbing[]`                                 | The list of configured stub behaviors                       |
| `stubbings[].args`           | `unknown[]`                                  | The stubbing's arguments to match                           |
| `stubbings[].behavior`       | `Behavior`                                   | The configured behavior of the stubbing                     |
| `stubbings[].behavior.type`  | `return`, `throw`, `resolve`, `reject`, `do` | Result type of the stubbing                                 |
| `stubbings[].behavior.value` | `unknown`                                    | Value for the behavior, if `type` is `return` or `resolve`  |
| `stubbings[].behavior.error` | `unknown`                                    | Error for the behavior, it `type` is `throw` or `reject`    |
| `stubbings[].matchedCalls`   | `unknown[][]`                                | Actual calls that matched the stubbing, if any              |
| `unmatchedCalls`             | `unknown[][]`                                | Actual calls that did not match a stubbing                  |

[mockName]: https://vitest.dev/api/mock.html#mockname
