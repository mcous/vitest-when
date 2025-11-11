/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unnecessary-type-parameters,
*/

import {
  describe,
  expect,
  expectTypeOf,
  it,
  type MockedClass,
  type MockedFunction,
  vi,
} from 'vitest'

import * as subject from '../src/vitest-when.ts'
import {
  complex,
  extraArguments,
  generic,
  overloaded,
  simple,
  simpleAsync,
  SimpleClass,
  untyped,
} from './fixtures.ts'

describe('vitest-when type signatures', () => {
  it('should handle an anonymous mock', () => {
    const result = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4)

    expectTypeOf(result).toEqualTypeOf<MockedFunction<(...args: any) => any>>()
  })

  it('should handle an untyped function', () => {
    const result = subject.when(untyped).calledWith(1).thenReturn('hello')

    expectTypeOf(result).toEqualTypeOf<MockedFunction<(...args: any) => any>>()
  })

  it('should handle a simple function', () => {
    const result = subject.when(simple).calledWith(1).thenReturn('hello')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<(input: number) => string>
    >()
  })

  it('should handle fewer than required arguments', () => {
    const result = subject
      .when(extraArguments, { ignoreExtraArgs: true })
      .calledWith(1)
      .thenReturn('hello')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<(input: number, second: number) => string>
    >()
  })

  it('should ensure correct type of previous arguments', () => {
    subject
      .when(extraArguments, { ignoreExtraArgs: true })
      /* @ts-expect-error: first arg is not correct */
      .calledWith(undefined, 2)
  })

  it('returns mock type for then resolve', () => {
    const result = subject.when(simpleAsync).calledWith(1).thenResolve('hello')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<(input: number) => Promise<string>>
    >()
  })

  it('returns mock type for then throw', () => {
    const result = subject.when(simple).calledWith(1).thenThrow('oh no')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<(input: number) => string>
    >()
  })

  it('returns mock type for then reject', () => {
    const result = subject.when(simpleAsync).calledWith(1).thenReject('oh no')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<(input: number) => Promise<string>>
    >()
  })

  it('returns mock type for then do', () => {
    const result = subject
      .when(simple)
      .calledWith(1)
      .thenDo(() => 'hello')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<(input: number) => string>
    >()
  })

  it('should handle an spied function', () => {
    const target = vi.spyOn({ simple }, 'simple')

    const result = subject.when(target).calledWith(1).thenReturn('hello')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<(input: number) => string>
    >()
  })

  it('should handle an spied class', () => {
    const target = vi.spyOn({ SimpleClass }, 'SimpleClass')

    const result = subject
      .when(target)
      .calledWith(1)
      .thenReturn({ simpleMethod: () => '' })

    expectTypeOf(result).toEqualTypeOf<
      MockedClass<new (input: number) => SimpleClass>
    >()
  })

  it('should handle a generic function', () => {
    const result = subject.when(generic).calledWith(1).thenReturn('hello')

    expectTypeOf(result).toEqualTypeOf<
      MockedFunction<<T>(input: T) => string>
    >()
  })

  it('should handle an overloaded function', () => {
    const result = subject.when(overloaded).calledWith(1).thenReturn('hello')

    expectTypeOf(result).toEqualTypeOf<MockedFunction<typeof overloaded>>()
  })

  it('should handle an overloaded function using an explicit type', () => {
    const result = subject
      .when<() => boolean>(overloaded)
      .calledWith()
      .thenReturn(true)

    expectTypeOf(result).toEqualTypeOf<MockedFunction<() => boolean>>()
  })

  it('should reject invalid usage of a simple function', () => {
    // @ts-expect-error: args missing
    subject.when(simple).calledWith()

    // @ts-expect-error: args wrong type
    subject.when(simple).calledWith('hello')

    // @ts-expect-error: return wrong type
    subject.when(simple).calledWith(1).thenReturn(42)
  })

  it('should reject invalid usage of a generic function', () => {
    // @ts-expect-error: args missing
    subject.when(generic).calledWith()

    // @ts-expect-error: args wrong type
    subject.when(generic<string>).calledWith(42)

    // @ts-expect-error: return wrong type
    subject.when(generic).calledWith(1).thenReturn(42)
  })

  it('should accept asymmetric matchers', () => {
    subject.when(simple).calledWith(expect.any(Number))
    subject.when(complex).calledWith(expect.objectContaining({ a: 1 }))
  })

  it('should accept a class constructor with a return', () => {
    const result = subject
      .when(SimpleClass)
      .calledWith(42)
      .thenReturn({ simpleMethod: () => '' })

    expectTypeOf(result).branded.toEqualTypeOf<
      MockedClass<new (input: number) => SimpleClass>
    >()

    // @ts-expect-error: args wrong type
    subject.when(TestClass).calledWith('42')
  })

  it('should accept a class constructor with a side-effect function', () => {
    const result = subject
      .when(SimpleClass)
      .calledWith(42)
      .thenDo(function (this: SimpleClass, input: number) {
        this.simpleMethod = () => `${input}`
      })

    expectTypeOf(result).branded.toEqualTypeOf<
      MockedClass<new (input: number) => SimpleClass>
    >()

    // @ts-expect-error: args wrong type
    subject.when(TestClass).calledWith('42')
  })
})
