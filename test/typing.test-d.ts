/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/restrict-template-expressions,
  func-style
*/

import { vi, describe, it, assertType } from 'vitest';
import * as subject from '../src/vitest-when.ts';

describe('vitest-when type signatures', () => {
  it('should handle an anonymous mock', () => {
    const spy = vi.fn();
    const stub = subject.when(spy).calledWith(1, 2, 3);

    assertType<subject.Stub<[number, number, number], any>>(stub);
  });

  it('should handle an untyped function', () => {
    const stub = subject.when(untyped).calledWith(1);

    stub.thenReturn('hello');

    assertType<subject.Stub<[number], any>>(stub);
  });

  it('should handle a simple function', () => {
    const stub = subject.when(simple).calledWith(1);

    stub.thenReturn('hello');

    assertType<subject.Stub<[1], string>>(stub);
  });

  it('should reject invalid usage of a simple function', () => {
    // @ts-expect-error: args missing
    subject.when(simple).calledWith();

    // @ts-expect-error: args wrong type
    subject.when(simple).calledWith('hello');

    // @ts-expect-error: return wrong type
    subject.when(simple).calledWith(1).thenReturn(42);
  });

  it('should handle an overloaded function using its last overload', () => {
    const stub = subject.when(overloaded).calledWith(1);

    stub.thenReturn('hello');

    assertType<subject.Stub<[1], string>>(stub);
  });

  it('should handle an overloaded function using its first overload', () => {
    const stub = subject.when(overloaded).calledWith();

    stub.thenReturn(null);

    assertType<subject.Stub<[], null>>(stub);
  });

  it('should handle an very overloaded function using its first overload', () => {
    const stub = subject.when(veryOverloaded).calledWith();

    stub.thenReturn(null);

    assertType<subject.Stub<[], null>>(stub);
  });

  it('should handle an overloaded function using its last overload', () => {
    const stub = subject.when(veryOverloaded).calledWith(1, 2, 3, 4);

    stub.thenReturn(42);

    assertType<subject.Stub<[1, 2, 3, 4], number>>(stub);
  });

  it('should reject invalid usage of a simple function', () => {
    // @ts-expect-error: args missing
    subject.when(simple).calledWith();

    // @ts-expect-error: args wrong type
    subject.when(simple).calledWith('hello');

    // @ts-expect-error: return wrong type
    subject.when(simple).calledWith(1).thenReturn(42);
  });
});

function untyped(...args: any[]): any {
  throw new Error(`untyped(...${args})`);
}

function simple(input: number): string {
  throw new Error(`simple(${input})`);
}

function overloaded(): null;
function overloaded(input: number): string;
function overloaded(input?: number): string | null {
  throw new Error(`overloaded(${input})`);
}

function veryOverloaded(): null;
function veryOverloaded(i1: number): string;
function veryOverloaded(i1: number, i2: number): boolean;
function veryOverloaded(i1: number, i2: number, i3: number): null;
function veryOverloaded(i1: number, i2: number, i3: number, i4: number): number;
function veryOverloaded(
  i1?: number,
  i2?: number,
  i3?: number,
  i4?: number
): string | boolean | number | null {
  throw new Error(`veryOverloaded(${i1}, ${i2}, ${i3}, ${i4})`);
}
