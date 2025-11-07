import { describe, expect, it, vi } from 'vitest'

import * as subject from '../src/vitest-when.ts'

const DEBUG_OPTIONS = { log: false }

describe('vitest-when debug', () => {
  it('debugs a non-stubbed spy', () => {
    const spy = vi.fn()

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result).toEqual({
      name: 'vi.fn()',
      stubbings: [],
      unmatchedCalls: [],
      description: expect.stringContaining(
        '0 stubbings with 0 calls',
      ) as string,
    })
  })

  it('debugs uncalled stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith('hello', 'world').thenReturn(42)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result).toEqual({
      name: 'vi.fn()',
      stubbings: [
        {
          args: ['hello', 'world'],
          plan: 'thenReturn',
          values: [42],
          calls: [],
        },
      ],
      unmatchedCalls: [],
      description: expect.stringContaining('1 stubbing with 0 calls') as string,
    } satisfies subject.DebugResult)
  })

  it('debugs called stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(expect.any(String)).thenReturn(42)

    spy('hello')
    spy('world')

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result).toEqual({
      name: 'vi.fn()',
      stubbings: [
        {
          args: [expect.any(String)],
          plan: 'thenReturn',
          values: [42],
          calls: [['hello'], ['world']],
        },
      ],
      unmatchedCalls: [],
      // Checkmark ✔ calls fulfilled by any stubbing
      description: expect.stringMatching(
        /2 calls:\n\s+✔ \("hello"\)\n\s+✔ \("world"\)/u,
      ) as string,
    } satisfies subject.DebugResult)
  })

  it('debugs unmatched calls', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(expect.any(String)).thenReturn(42)

    spy(1234)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result).toEqual({
      name: 'vi.fn()',
      stubbings: [
        {
          args: [expect.any(String)],
          plan: 'thenReturn',
          values: [42],
          calls: [],
        },
      ],
      unmatchedCalls: [[1234]],
      description: expect.stringMatching(/1 call:\n\s+- \(1234\)/) as string,
    } satisfies subject.DebugResult)
  })

  it('describes thenReturn stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith('hello', 'world').thenReturn(42)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch('("hello", "world"), then return `42`')
  })

  it('describes multiple values', () => {
    const spy = vi.fn().mockName('spy')

    subject.when(spy).calledWith('hello', 'world').thenReturn(42, 1337)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(
      `("hello", "world"), then return \`42\`, then \`1337\``,
    )
  })

  it('describes thenResolve stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith('hello', 'world').thenResolve(42)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch('("hello", "world"), then resolve `42`')
  })

  it('describes thenThrow stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith('hello', 'world').thenThrow(new Error('oh no'))

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(
      '("hello", "world"), then throw `[Error: oh no]`',
    )
  })

  it('describes thenReject stubbings', () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith('hello', 'world')
      .thenReject(new Error('oh no'))

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(
      '("hello", "world"), then reject `[Error: oh no]`',
    )
  })

  it('describes thenDo stubbings', () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith('hello', 'world')
      .thenDo(() => 42)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(
      '("hello", "world"), then return `[Function anonymous]`',
    )
  })

  it('describes calls with non-JSONifiable objects', () => {
    const spy = vi.fn()
    const value = {
      toJSON() {
        throw new Error('oh no')
      },
    }

    spy(value)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(
      /1 call:\n\s+- \(\{"toJSON": \[Function toJSON\]\}\)/,
    )
  })

  it('describes calls with long values', () => {
    const spy = vi.fn()
    const longString = 'x'.repeat(1000)
    const value = Array.from({ length: 10 }, () => longString)

    spy(value)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(/1 call:\n\s+- \(\["x.+, …\]\)/u)
  })
})
