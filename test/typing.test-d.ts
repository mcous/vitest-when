/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/restrict-template-expressions
*/

import { assertType, describe, it, vi } from 'vitest'

import * as subject from '../src/vitest-when.ts'

describe('vitest-when type signatures', () => {
  it('should handle an anonymous mock', () => {
    const spy = vi.fn()
    const stub = subject.when(spy).calledWith(1, 2, 3)

    assertType<subject.Stub<[number, number, number], any>>(stub)
  })

  it('should handle an untyped function', () => {
    const stub = subject.when(untyped).calledWith(1)

    stub.thenReturn('hello')

    assertType<subject.Stub<[number], any>>(stub)
  })

  it('should handle an spied function', () => {
    const target = { simple }
    const spy = vi.spyOn(target, 'simple')
    const stub = subject.when(spy).calledWith(1)

    stub.thenReturn('hello')

    assertType<subject.Stub<[number], any>>(stub)
  })

  it('should handle a simple function', () => {
    const stub = subject.when(simple).calledWith(1)

    stub.thenReturn('hello')

    assertType<subject.Stub<[1], string>>(stub)
  })

  it('should handle a generic function', () => {
    const stub = subject.when(generic).calledWith(1)

    stub.thenReturn('hello')

    assertType<subject.Stub<[number], string>>(stub)
  })

  it('should handle an overloaded function using its last overload', () => {
    const stub = subject.when(overloaded).calledWith(1)

    stub.thenReturn('hello')

    assertType<subject.Stub<[1], string>>(stub)
  })

  it('should handle an overloaded function using an explicit type', () => {
    const stub = subject.when<() => boolean>(overloaded).calledWith()

    stub.thenReturn(true)

    assertType<subject.Stub<[], boolean>>(stub)
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
})

function untyped(...args: any[]): any {
  throw new Error(`untyped(...${args})`)
}

function simple(input: number): string {
  throw new Error(`simple(${input})`)
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
