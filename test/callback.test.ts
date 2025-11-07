import { describe, expect, it, vi } from 'vitest'

import * as subject from '../src/vitest-when.ts'

describe('vitest-when callback', () => {
  it('invokes an implied callback', async () => {
    const next = vi.fn()
    const spy = subject
      .when(vi.fn())
      .calledWith('hello', 'world')
      .thenCallback(undefined, 'okay')

    expect(spy('hello', 'world', next)).toBeUndefined()

    await subject.nextTick()
    expect(next).toHaveBeenCalledExactlyOnceWith(undefined, 'okay')
  })

  it('invokes a specified callback', async () => {
    const next = vi.fn()
    const spy = subject
      .when(vi.fn())
      .calledWith('hello', expect.callback(), 'world')
      .thenCallback('okay')

    spy('hello', next, 'world')

    await subject.nextTick()
    expect(next).toHaveBeenCalledExactlyOnceWith('okay')
  })

  it('invokes multiple specified callbacks', async () => {
    const next = vi.fn()
    const spy = subject
      .when(vi.fn())
      .calledWith(
        expect.callback(undefined, 'onStart'),
        expect.callback(undefined, 'onEnd'),
      )
      .thenReturn('okay')

    expect(spy(next, next)).toBe('okay')

    await subject.nextTick()
    expect(next).toHaveBeenCalledTimes(2)
    expect(next).toHaveBeenNthCalledWith(1, undefined, 'onStart')
    expect(next).toHaveBeenNthCalledWith(2, undefined, 'onEnd')
  })

  it('appends implied callback even when specified callbacks are provided', async () => {
    const next = vi.fn()
    const spy = subject
      .when(vi.fn())
      .calledWith(expect.callback('first'))
      .thenCallback('second')

    spy(next, next)

    await subject.nextTick()
    expect(next).toHaveBeenCalledTimes(2)
    expect(next).toHaveBeenNthCalledWith(1, 'first')
    expect(next).toHaveBeenNthCalledWith(2, 'second')
  })
})
