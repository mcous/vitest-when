/* eslint-disable
  @typescript-eslint/require-await,
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/restrict-template-expressions
*/

import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import * as subject from '../src/vitest-when.ts'

describe('vitest-when type signatures', () => {
  it('should handle an anonymous mock', () => {
    const result = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4)

    expectTypeOf(result).parameters.toEqualTypeOf<any[]>()
    expectTypeOf(result).returns.toEqualTypeOf<any>()
    expectTypeOf(result.mock.calls).toEqualTypeOf<any[][]>()
  })

  it('should handle an untyped function', () => {
    const result = subject.when(untyped).calledWith(1).thenReturn('hello')

    expectTypeOf(result.mock.calls).toEqualTypeOf<any[][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<any[]>()
    expectTypeOf(result).returns.toEqualTypeOf<any>()
  })

  it('should handle a simple function', () => {
    const result = subject.when(simple).calledWith(1).thenReturn('hello')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[number][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[number]>()
    expectTypeOf(result).returns.toEqualTypeOf<string>()
  })

  it('returns mock type for then resolve', () => {
    const result = subject.when(simpleAsync).calledWith(1).thenResolve('hello')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[number][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[number]>()
    expectTypeOf(result).returns.toEqualTypeOf<Promise<string>>()
  })

  it('returns mock type for then throw', () => {
    const result = subject.when(simple).calledWith(1).thenThrow('oh no')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[number][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[number]>()
    expectTypeOf(result).returns.toEqualTypeOf<string>()
  })

  it('returns mock type for then reject', () => {
    const result = subject.when(simpleAsync).calledWith(1).thenReject('oh no')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[number][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[number]>()
    expectTypeOf(result).returns.toEqualTypeOf<Promise<string>>()
  })

  it('returns mock type for then do', () => {
    const result = subject
      .when(simple)
      .calledWith(1)
      .thenDo(() => 'hello')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[number][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[number]>()
    expectTypeOf(result).returns.toEqualTypeOf<string>()
  })

  it('should handle an spied function', () => {
    const target = vi.spyOn({ simple }, 'simple')

    const result = subject.when(target).calledWith(1).thenReturn('hello')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[number][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[number]>()
    expectTypeOf(result).returns.toEqualTypeOf<string>()
  })

  it('should handle a generic function', () => {
    const result = subject.when(generic).calledWith(1).thenReturn('hello')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[unknown][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[unknown]>()
    expectTypeOf(result).returns.toEqualTypeOf<string>()
  })

  it('should handle an overloaded function using its last overload', () => {
    const result = subject.when(overloaded).calledWith(1).thenReturn('hello')

    expectTypeOf(result.mock.calls).toEqualTypeOf<[number][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[number]>()
    expectTypeOf(result).returns.toEqualTypeOf<string>()
  })

  it('should handle an overloaded function using an explicit type', () => {
    const result = subject
      .when<() => boolean>(overloaded)
      .calledWith()
      .thenReturn(true)

    expectTypeOf(result.mock.calls).toEqualTypeOf<[][]>()
    expectTypeOf(result).parameters.toEqualTypeOf<[]>()
    expectTypeOf(result).returns.toEqualTypeOf<boolean>()
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

  it('should accept a class constructor', () => {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    class TestClass {
      constructor(input: number) {
        throw new Error(`TestClass(${input})`)
      }
    }

    const result = subject
      .when(TestClass)
      .calledWith(42)
      .thenReturn({} as TestClass)

    expectTypeOf(result.mock.instances).toEqualTypeOf<TestClass[]>()
    expectTypeOf(result).constructorParameters.toEqualTypeOf<[number]>()

    // @ts-expect-error: args wrong type
    subject.when(TestClass).calledWith('42')
  })
})

function untyped(...args: any[]): any {
  throw new Error(`untyped(...${args})`)
}

function simple(input: number): string {
  throw new Error(`simple(${input})`)
}

async function simpleAsync(input: number): Promise<string> {
  throw new Error(`simpleAsync(${input})`)
}

function complex(input: { a: number; b: string }): string {
  throw new Error(`simple({ a: ${input.a}, b: ${input.b} })`)
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function generic<T>(input: T): string {
  throw new Error(`generic(${input})`)
}

function overloaded(): boolean
function overloaded(input: number): string
function overloaded(input?: number): string | boolean {
  throw new Error(`overloaded(${input})`)
}
