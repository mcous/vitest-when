import { vi, describe, expect, it } from 'vitest'

import * as subject from '../src/vitest-when.ts'

declare module 'vitest' {
  interface AsymmetricMatchersContaining {
    toBeFoo(): unknown
  }
}

expect.extend({
  toBeFoo(received) {
    return {
      pass: received === 'foo',
      message: () => '',
    }
  },
})

const noop = () => undefined

describe('vitest-when', () => {
  it('should raise an error if passed a non-spy', () => {
    expect(() => {
      subject.when(noop)
    }).toThrow(subject.NotAMockFunctionError)
  })

  it('should return undefined by default', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn(4)

    expect(spy()).toEqual(undefined)
    expect(spy(1)).toEqual(undefined)
    expect(spy(1, 2)).toEqual(undefined)
    expect(spy(1, 2, 3, 4)).toEqual(undefined)
    expect(spy(4, 5, 6)).toEqual(undefined)
  })

  it('should return a value', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn(4)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(4)
  })

  it('should return undefined if passed nothing', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn()

    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should return a value once', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn(4, subject.ONCE)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should be resettable', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn(4)
    vi.resetAllMocks()

    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should throw an error', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenThrow(new Error('oh no'))

    expect(() => {
      spy(1, 2, 3)
    }).toThrow('oh no')
  })

  it('should resolve a Promise', async () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenResolve(4)

    await expect(spy(1, 2, 3)).resolves.toEqual(4)
  })

  it('should resolve undefined if passed nothing', async () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenResolve()

    await expect(spy(1, 2, 3)).resolves.toEqual(undefined)
  })

  it('should reject a Promise', async () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReject(new Error('oh no'))

    await expect(spy(1, 2, 3)).rejects.toThrow('oh no')
  })

  it('should do a callback', () => {
    const spy = vi.fn()
    const callback = vi.fn(() => 4)

    subject.when(spy).calledWith(1, 2, 3).thenDo(callback)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(callback).toHaveBeenCalledWith(1, 2, 3)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should return multiple values', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn(4, 5, 6)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(5)
    expect(spy(1, 2, 3)).toEqual(6)
    expect(spy(1, 2, 3)).toEqual(6)
  })

  it('should resolve multiple values', async () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenResolve(4, 5, 6)

    await expect(spy(1, 2, 3)).resolves.toEqual(4)
    await expect(spy(1, 2, 3)).resolves.toEqual(5)
    await expect(spy(1, 2, 3)).resolves.toEqual(6)
    await expect(spy(1, 2, 3)).resolves.toEqual(6)
  })

  it('should reject multiple errors', async () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith(1, 2, 3)
      .thenReject(new Error('4'), new Error('5'), new Error('6'))

    await expect(spy(1, 2, 3)).rejects.toThrow('4')
    await expect(spy(1, 2, 3)).rejects.toThrow('5')
    await expect(spy(1, 2, 3)).rejects.toThrow('6')
    await expect(spy(1, 2, 3)).rejects.toThrow('6')
  })

  it('should reject once', async () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith(1, 2, 3)
      .thenReject(new Error('4'), subject.ONCE)

    await expect(spy(1, 2, 3)).rejects.toThrow('4')
    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should throw multiple errors', () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith(1, 2, 3)
      .thenThrow(new Error('4'), new Error('5'), new Error('6'))

    expect(() => {
      spy(1, 2, 3)
    }).toThrow('4')
    expect(() => {
      spy(1, 2, 3)
    }).toThrow('5')
    expect(() => {
      spy(1, 2, 3)
    }).toThrow('6')
    expect(() => {
      spy(1, 2, 3)
    }).toThrow('6')
  })

  it('should call multiple callbacks', () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith(1, 2, 3)
      .thenDo(
        () => 4,
        () => 5,
        () => 6,
      )

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(5)
    expect(spy(1, 2, 3)).toEqual(6)
    expect(spy(1, 2, 3)).toEqual(6)
  })

  it('should allow multiple different stubs', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn(4)
    subject.when(spy).calledWith(4, 5, 6).thenReturn(7)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(4, 5, 6)).toEqual(7)
  })

  it('should use the latest stub', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(1, 2, 3).thenReturn(4)
    subject.when(spy).calledWith(1, 2, 3).thenReturn(1000)

    expect(spy(1, 2, 3)).toEqual(1000)
  })

  it('should respect asymmetric matchers', () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith(expect.stringContaining('foo'))
      .thenReturn(1000)

    expect(spy('foobar')).toEqual(1000)
  })

  it('should respect custom asymmetric matchers', () => {
    const spy = vi.fn()

    subject.when(spy).calledWith(expect.toBeFoo()).thenReturn(1000)

    expect(spy('foo')).toEqual(1000)
  })

  it('should deeply check object arguments', () => {
    const spy = vi.fn()

    subject
      .when(spy)
      .calledWith({ foo: { bar: { baz: 0 } } })
      .thenReturn(100)

    expect(spy({ foo: { bar: { baz: 0 } } })).toEqual(100)
  })
})
