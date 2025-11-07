import { describe, expect, it, vi } from 'vitest'

import * as subject from '../src/vitest-when.ts'
import { SimpleClass } from './fixtures.ts'

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
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4)

    expect(spy()).toEqual(undefined)
    expect(spy(1)).toEqual(undefined)
    expect(spy(1, 2)).toEqual(undefined)
    expect(spy(1, 2, 3, 4)).toEqual(undefined)
    expect(spy(4, 5, 6)).toEqual(undefined)
  })

  it('should return a value', () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(4)
  })

  it('should return undefined if passed nothing', () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn()

    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should fall back to original mock implementation', () => {
    const spy = subject
      .when(vi.fn().mockReturnValue(100))
      .calledWith(1, 2, 3)
      .thenReturn(4)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy()).toEqual(100)
  })

  it('should fall back to original implementation after reset', () => {
    const spy = vi.fn((n) => 2 * n)

    vi.resetAllMocks()
    expect(spy(2)).toEqual(4)

    subject.when(spy).calledWith(1).thenReturn(4)
    expect(spy(1)).toEqual(4)
    expect(spy(2)).toEqual(4)
  })

  it('should return a number of times', () => {
    const spy = subject
      .when(vi.fn(), { times: 2 })
      .calledWith(1, 2, 3)
      .thenReturn(4)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should be resettable', () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4)
    vi.resetAllMocks()

    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should throw an error', () => {
    const spy = subject
      .when(vi.fn())
      .calledWith(1, 2, 3)
      .thenThrow(new Error('oh no'))

    expect(() => {
      spy(1, 2, 3)
    }).toThrow('oh no')
  })

  it('should resolve a Promise', async () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenResolve(4)

    await expect(spy(1, 2, 3)).resolves.toEqual(4)
  })

  it('should resolve undefined if passed nothing', async () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenResolve()

    await expect(spy(1, 2, 3)).resolves.toEqual(undefined)
  })

  it('should reject a Promise', async () => {
    const spy = subject
      .when(vi.fn())
      .calledWith(1, 2, 3)
      .thenReject(new Error('oh no'))

    await expect(spy(1, 2, 3)).rejects.toThrow('oh no')
  })

  it('should do a callback', () => {
    const callback = vi.fn(() => 4)
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenDo(callback)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(callback).toHaveBeenCalledWith(1, 2, 3)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should mock a constructor via thenDo', () => {
    const Spy = subject
      .when(vi.fn<typeof SimpleClass>())
      .calledWith(42)
      .thenDo(function (this: SimpleClass) {
        this.simpleMethod = () => 'hello'
      })

    expect(new Spy(42).simpleMethod()).toBe('hello')
  })

  it('should mock a constructor via thenReturn', () => {
    const Spy = subject
      .when(vi.fn<typeof SimpleClass>())
      .calledWith(42)
      .thenReturn({ simpleMethod: () => 'hello' })

    expect(new Spy(42).simpleMethod()).toBe('hello')
  })

  it('should return multiple values', () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4, 5, 6)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(1, 2, 3)).toEqual(5)
    expect(spy(1, 2, 3)).toEqual(6)
    expect(spy(1, 2, 3)).toEqual(6)
  })

  it('should resolve multiple values', async () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenResolve(4, 5, 6)

    await expect(spy(1, 2, 3)).resolves.toEqual(4)
    await expect(spy(1, 2, 3)).resolves.toEqual(5)
    await expect(spy(1, 2, 3)).resolves.toEqual(6)
    await expect(spy(1, 2, 3)).resolves.toEqual(6)
  })

  it('should reject multiple errors', async () => {
    const spy = subject
      .when(vi.fn())
      .calledWith(1, 2, 3)
      .thenReject(new Error('4'), new Error('5'), new Error('6'))

    await expect(spy(1, 2, 3)).rejects.toThrow('4')
    await expect(spy(1, 2, 3)).rejects.toThrow('5')
    await expect(spy(1, 2, 3)).rejects.toThrow('6')
    await expect(spy(1, 2, 3)).rejects.toThrow('6')
  })

  it('should reject a number of times', async () => {
    const spy = subject
      .when(vi.fn(), { times: 2 })
      .calledWith(1, 2, 3)
      .thenReject(new Error('4'))

    await expect(spy(1, 2, 3)).rejects.toThrow('4')
    await expect(spy(1, 2, 3)).rejects.toThrow('4')
    expect(spy(1, 2, 3)).toEqual(undefined)
  })

  it('should throw multiple errors', () => {
    const spy = subject
      .when(vi.fn())
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
    const spy = subject
      .when(vi.fn())
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
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4)
    subject.when(spy).calledWith(4, 5, 6).thenReturn(7)

    expect(spy(1, 2, 3)).toEqual(4)
    expect(spy(4, 5, 6)).toEqual(7)
  })

  it('should use the latest stub', () => {
    const spy = subject.when(vi.fn()).calledWith(1, 2, 3).thenReturn(4)
    subject.when(spy).calledWith(1, 2, 3).thenReturn(1000)

    expect(spy(1, 2, 3)).toEqual(1000)
  })

  it('should respect asymmetric matchers', () => {
    const spy = subject
      .when(vi.fn())
      .calledWith(expect.stringContaining('foo'))
      .thenReturn(1000)

    expect(spy('foobar')).toEqual(1000)
  })

  it('should respect custom asymmetric matchers', () => {
    const spy = subject
      .when(vi.fn())
      .calledWith(expect.toBeFoo())
      .thenReturn(1000)

    expect(spy('foo')).toEqual(1000)
  })

  it('should deeply check object arguments', () => {
    const spy = subject
      .when(vi.fn())
      .calledWith({ foo: { bar: { baz: 0 } } })
      .thenReturn(100)

    expect(spy({ foo: { bar: { baz: 0 } } })).toEqual(100)
  })

  it('should not trigger unhandled rejection warnings when rejection unused', () => {
    const error = new Error('uh uhh')
    subject.when(vi.fn()).calledWith('/api/foo').thenReject(error)

    // intentionally do not call the spy
    expect(true).toBe(true)
  })

  it('should ignore extra args if configured', () => {
    const spy = subject
      .when(vi.fn(), { ignoreExtraArgs: true })
      .calledWith('Outcomes are:')
      .thenReturn('loggy')

    expect(spy('Outcomes are:')).toEqual('loggy')
    expect(spy('Outcomes are:', 'stuff')).toEqual('loggy')
    expect(spy('Outcomes are:', 'stuff', 'that', 'keeps', 'going')).toEqual(
      'loggy',
    )
    expect(spy('Outcomes are not:', 'stuff')).toEqual(undefined)
  })

  it('should ignore all args if configured', () => {
    const spy = subject
      .when(vi.fn(), { ignoreExtraArgs: true })
      .calledWith()
      .thenReturn('yesss')

    expect(spy()).toEqual('yesss')
    expect(spy(1, 2, 3, 4, 5)).toEqual('yesss')
  })
})
