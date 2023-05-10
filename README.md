# vitest-when

Stub behaviors of [vitest][] mocks based on how they are called with a small, readable, and opinionated API. Inspired by [testdouble.js][] and [jest-when][].

```shell
npm install --save-dev vitest-when
```

[vitest]: https://vitest.dev/
[testdouble.js]: https://github.com/testdouble/testdouble.js/
[jest-when]: https://github.com/timkindberg/jest-when

## Why?

[Vitest mock functions][] are powerful, but have an overly permissive API, inherited from Jest. This API makes it hard to use mocks to their full potential of providing meaningful design feedback while writing tests.

- It's easy to make silly mistakes, like mocking a return value without checking the arguments.
- Mock usage requires calls in both the [arrange and assert][] phases a test (e.g. configure return value, assert called with proper arguments), which harms test readability and maintainability.

To avoid these issues, vitest-when wraps vitest mocks in a focused, opinionated API that allows you to configure mock behaviors if and only if they are called as you expect.

[vitest mock functions]: https://vitest.dev/api/mock.html#mockreset
[arrange and assert]: https://github.com/testdouble/contributing-tests/wiki/Arrange-Act-Assert

## Usage

0. Add `vi.resetAllMocks` to your suite's `afterEach` hook
1. Use `when(mock).calledWith(...)` to specify matching arguments
2. Configure a behavior with a stub method:
   - Return a value: `.thenReturn(...)`
   - Resolve a `Promise`: `.thenResolve(...)`
   - Throw an error: `.thenThrow(...)`
   - Reject a `Promise`: `.thenReject(...)`
   - Trigger a callback: `.thenDo(...)`

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

describe('subject under test', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should delegate work to dependency', async () => {
    when(deepThought.calculateAnswer).calledWith().thenResolve(42);
    when(earth.calculateQuestion).calledWith(42).thenResolve("What's 6 by 9?");

    const result = await subject.createMeaning();

    expect(result).toEqual({ question: "What's 6 by 9?", answer: 42 });
  });
});

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

// deep-thought.ts
export const calculateAnswer = async (): Promise<number> => {
  throw new Error(`calculateAnswer() not implemented`);
};

// earth.ts
export const calculateQuestion = async (answer: number): Promise<string> => {
  throw new Error(`calculateQuestion(${answer}) not implemented`);
};
```

## API

### `when(spy: Mock<TArgs, TReturn>).calledWith(...args: TArgs): Stub<TArgs, TReturn>`

Create's a stub for a given set of arguments that you can then configure with different behaviors.

```ts
const spy = vi.fn();

when(spy).calledWith('hello').thenReturn('world');

expect(spy('hello')).toEqual('world');
```

When a call to a mock uses arguments that match those given to `calledWith`, a configured behavior will be triggered. All arguments must match, though you can use vitest's [asymmetric matchers][] to loosen the stubbing:

```ts
const spy = vi.fn();

when(spy).calledWith(expect.any(String)).thenReturn('world');

expect(spy('hello')).toEqual('world');
expect(spy('anything')).toEqual('world');
```

If `calledWith` is used multiple times, the last configured stubbing will be used.

```ts
when(spy).calledWith("hello").thenReturn("world")
expect(spy("hello")).toEqual("world")
when(spy).calledWith("hello").thenReturn("goodbye"
expect(spy("hello")).toEqual("goodbye")
```

[asymmetric matchers]: https://vitest.dev/api/expect.html#expect-anything

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

## See also

- [testdouble-vitest][] - Use [testdouble.js][] mocks with Vitest instead of the default [tinyspy][] mocks.

[testdouble-vitest]: https://github.com/mcous/testdouble-vitest
[tinyspy]: https://github.com/tinylibs/tinyspy
