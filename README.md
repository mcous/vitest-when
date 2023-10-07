# vitest-when

[![npm badge][]][npm]
[![ci badge][]][ci]
[![coverage badge][]][coverage]

Stub behaviors of [Vitest][] mock functions with a small, readable API. Inspired by [testdouble.js][] and [jest-when][].

```shell
npm install --save-dev vitest-when
```

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
import { vi, test, afterEach } from 'vitest';
import { when } from '';

afterEach(() => {
  vi.resetAllMocks();
});

test('stubbing with vitest-when', () => {
  const stub = vi.fn();

  when(stub).calledWith(1, 2, 3).thenReturn(4);
  when(stub).calledWith(4, 5, 6).thenReturn(7);

  let result = stub(1, 2, 3);
  expect(result).toBe(4);

  result = stub(4, 5, 6);
  expect(result).toBe(7);

  result = stub(7, 8, 9);
  expect(result).toBe(undefined);
});
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
const stub = vi.fn();
stub.mockReturnValue('world');

// act
const result = stub('hello');

// assert
expect(stub).toHaveBeenCalledWith('hello');
expect(result).toBe('world');
```

In contrast, when using vitest-when stubs:

- All stub configuration happens in the "arrange" phase of your test.
- You cannot forget `calledWith`.
- `calledWith` and `thenReturn` (et. al.) are fully type-checked.

```ts
// arrange
const stub = vi.fn();
when(stub).calledWith('hello').thenReturn('world');

// act
const result = stub('hello');

// assert
expect(result).toBe('world');
```

[arrange and assert]: https://github.com/testdouble/contributing-tests/wiki/Arrange-Act-Assert

### Example

See the [./example](./example) directory for example usage.

```ts
// meaning-of-life.test.ts
import { vi, describe, afterEach, it, expect } from 'vitest';
import { when } from '../src/vitest-when.ts';

import * as deepThought from './deep-thought.ts';
import * as earth from './earth.ts';
import * as subject from './meaning-of-life.ts';

vi.mock('./deep-thought.ts');
vi.mock('./earth.ts');

describe('get the meaning of life', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should get the answer and the question', async () => {
    when(deepThought.calculateAnswer).calledWith().thenResolve(42);
    when(earth.calculateQuestion).calledWith(42).thenResolve("What's 6 by 9?");

    const result = await subject.createMeaning();

    expect(result).toEqual({ question: "What's 6 by 9?", answer: 42 });
  });
});
```

```ts
// meaning-of-life.ts
import { calculateAnswer } from './deep-thought.ts';
import { calculateQuestion } from './earth.ts';

export interface Meaning {
  question: string;
  answer: number;
}

export const createMeaning = async (): Promise<Meaning> => {
  const answer = await calculateAnswer();
  const question = await calculateQuestion(answer);

  return { question, answer };
};
```

```ts
// deep-thought.ts
export const calculateAnswer = async (): Promise<number> => {
  throw new Error(`calculateAnswer() not implemented`);
};
```

```ts
// earth.ts
export const calculateQuestion = async (answer: number): Promise<string> => {
  throw new Error(`calculateQuestion(${answer}) not implemented`);
};
```

## API

### `when(spy: TFunc): StubWrapper<TFunc>`

Configures a `vi.fn()` mock function to act as a vitest-when stub. Adds an implementation to the function that initially no-ops, and returns an API to configure behaviors for given arguments using [`.calledWith(...)`][called-with]

```ts
import { vi } from 'vitest';
import { when } from 'vitest-when';

const spy = vi.fn();

when(spy);

expect(spy()).toBe(undefined);
```

### `.calledWith(...args: TArgs): Stub<TArgs, TReturn>`

Create a stub that matches a given set of arguments which you can configure with different behaviors using methods like [`.thenReturn(...)`][then-return].

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenReturn('world');

expect(spy('hello')).toEqual('world');
```

When a call to a mock uses arguments that match those given to `calledWith`, a configured behavior will be triggered. All arguments must match, but you can use Vitest's [asymmetric matchers][] to loosen the stubbing:

```ts
const spy = vi.fn();

when(spy).calledWith(expect.any(String)).thenReturn('world');

expect(spy('hello')).toEqual('world');
expect(spy('anything')).toEqual('world');
```

If `calledWith` is used multiple times, the last configured stubbing will be used.

```ts
when(spy).calledWith('hello').thenReturn('world');
expect(spy('hello')).toEqual('world');
when(spy).calledWith('hello').thenReturn('goodbye');
expect(spy('hello')).toEqual('goodbye');
```

[asymmetric matchers]: https://vitest.dev/api/expect.html#expect-anything

#### Types of overloaded functions

Due to fundamental limitations of how TypeScript handles the types of overloaded functions, `when` will always pick the _last_ overload as the type of `TFunc`. You can use the `TFunc` type argument of when to customize this if you're stubbing a different overload:

```ts
function overloaded(): null;
function overloaded(input: number): string;
function overloaded(input?: number): string | null {
  // ...
}

when<() => null>(overloaded).calledWith().thenReturn(null);
```

### `.thenReturn(value: TReturn)`

When the stubbing is satisfied, return `value`

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenReturn('world');

expect(spy('hello')).toEqual('world');
```

To only return a value once, use the `ONCE` option.

```ts
import { ONCE, when } from 'vitest-when';

const spy = vi.fn();

when(spy).calledWith('hello').thenReturn('world', ONCE);

expect(spy('hello')).toEqual('world');
expect(spy('hello')).toEqual(undefined);
```

You may pass several values to `thenReturn` to return different values in succession. The last value will be latched, unless you pass the `ONCE` option.

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenReturn('hi', 'sup?');

expect(spy('hello')).toEqual('hi');
expect(spy('hello')).toEqual('sup?');
expect(spy('hello')).toEqual('sup?');
```

### `.thenResolve(value: TReturn)`

When the stubbing is satisfied, resolve a `Promise` with `value`

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenResolve('world');

expect(await spy('hello')).toEqual('world');
```

To only resolve a value once, use the `ONCE` option.

```ts
import { ONCE, when } from 'vitest-when';

const spy = vi.fn();

when(spy).calledWith('hello').thenResolve('world', ONCE);

expect(await spy('hello')).toEqual('world');
expect(spy('hello')).toEqual(undefined);
```

You may pass several values to `thenResolve` to resolve different values in succession. The last value will be latched, unless you pass the `ONCE` option.

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenResolve('hi', 'sup?');

expect(await spy('hello')).toEqual('hi');
expect(await spy('hello')).toEqual('sup?');
expect(await spy('hello')).toEqual('sup?');
```

### `.thenThrow(error: unknown)`

When the stubbing is satisfied, throw `error`.

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenThrow(new Error('oh no'));

expect(() => spy('hello')).toThrow('oh no');
```

To only throw an error only once, use the `ONCE` option.

```ts
import { ONCE, when } from 'vitest-when';

const spy = vi.fn();

when(spy).calledWith('hello').thenThrow(new Error('oh no'), ONCE);

expect(() => spy('hello')).toThrow('oh no');
expect(spy('hello')).toEqual(undefined);
```

You may pass several values to `thenThrow` to throw different errors in succession. The last value will be latched, unless you pass the `ONCE` option.

```ts
const spy = vi.fn();

when(spy)
  .calledWith('hello')
  .thenThrow(new Error('oh no'), new Error('this is bad'));

expect(() => spy('hello')).toThrow('oh no');
expect(() => spy('hello')).toThrow('this is bad');
expect(() => spy('hello')).toThrow('this is bad');
```

### `.thenReject(error: unknown)`

When the stubbing is satisfied, reject a `Promise` with `error`.

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenReject(new Error('oh no'));

await expect(spy('hello')).rejects.toThrow('oh no');
```

To only throw an error only once, use the `ONCE` option.

```ts
import { ONCE, when } from 'vitest-when';

const spy = vi.fn();

when(spy).calledWith('hello').thenReject(new Error('oh no'), ONCE);

await expect(spy('hello')).rejects.toThrow('oh no');
expect(spy('hello')).toEqual(undefined);
```

You may pass several values to `thenReject` to throw different errors in succession. The last value will be latched, unless you pass the `ONCE` option.

```ts
const spy = vi.fn();

when(spy)
  .calledWith('hello')
  .thenReject(new Error('oh no'), new Error('this is bad'));

await expect(spy('hello')).rejects.toThrow('oh no');
await expect(spy('hello')).rejects.toThrow('this is bad');
await expect(spy('hello')).rejects.toThrow('this is bad');
```

### `.thenDo(callback: (...args: TArgs) => TReturn)`

When the stubbing is satisfied, run `callback` to trigger a side-effect and return its result (if any). `thenDo` is a relatively powerful tool for stubbing complex behaviors, so if you find yourself using `thenDo` often, consider refactoring your code to use more simple interactions! Your future self will thank you.

```ts
const spy = vi.fn();
let called = false;

when(spy)
  .calledWith('hello')
  .thenDo(() => {
    called = true;
    return 'world';
  });

expect(spy('hello')).toEqual('world');
expect(called).toEqual(true);
```

To only run the callback once, use the `ONCE` option.

```ts
import { ONCE, when } from 'vitest-when';

const spy = vi.fn();

when(spy)
  .calledWith('hello')
  .thenDo(() => 'world', ONCE);

expect(spy('hello')).toEqual('world');
expect(spy('hello')).toEqual(undefined);
```

You may pass several callbacks to `thenDo` to trigger different side-effects in succession. The last callback will be latched, unless you pass the `ONCE` option.

```ts
const spy = vi.fn();

when(spy)
  .calledWith('hello')
  .thenDo(
    () => 'world',
    () => 'solar system'
  );

expect(spy('hello')).toEqual('world');
expect(spy('hello')).toEqual('solar system');
```
