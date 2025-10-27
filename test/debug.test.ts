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
          behavior: { type: 'return', value: 42 },
          calls: [],
        },
      ],
      unmatchedCalls: [],
      description: expect.stringContaining('1 stubbing with 0 calls') as string,
    })
  })

  it('debugs called stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(expect.any(String)).thenReturn(42)

    spy('hello')
    spy('world')

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result).toMatchObject({
      name: 'vi.fn()',
      stubbings: [
        {
          args: [expect.any(String)],
          behavior: { type: 'return', value: 42 },
          calls: [['hello'], ['world']],
        },
      ],
      unmatchedCalls: [],
      description: expect.stringContaining('1 stubbing with 2 calls') as string,
    })
  })

  it('debugs unmatched calls', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(expect.any(String)).thenReturn(42)

    spy(1234)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result).toMatchObject({
      name: 'vi.fn()',
      stubbings: [
        {
          args: [expect.any(String)],
          behavior: { type: 'return', value: 42 },
          calls: [],
        },
      ],
      unmatchedCalls: [[1234]],
      description: expect.stringContaining('1 unmatched call') as string,
    })
  })

  it('describes thenReturn stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith('hello', 'world').thenReturn(42)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch('("hello", "world") => 42')
  })

  it('describes thenResolve stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith('hello', 'world').thenResolve(42)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(
      '("hello", "world") => Promise.resolve(42)',
    )
  })

  it('describes thenThrow stubbings', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith('hello', 'world').thenThrow(new Error('oh no'))

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(
      '("hello", "world") => { throw [Error: oh no] }',
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
      '("hello", "world") => Promise.reject([Error: oh no])',
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
      '("hello", "world") => [Function anonymous]()',
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

    expect(result.description).toMatch('({"toJSON": [Function toJSON]})')
  })

  it('describes calls with long values', () => {
    const spy = vi.fn()
    const longString = Array.from({ length: 1001 }).join('x')
    const value = Array.from({ length: 100 })
    value.fill(longString)

    spy(value)

    const result = subject.debug(spy, DEBUG_OPTIONS)

    expect(result.description).toMatch(/\(\["x.+, …\]\)/u)
  })
})
