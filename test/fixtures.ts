/* eslint-disable
  @typescript-eslint/require-await,
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unnecessary-type-parameters,
  @typescript-eslint/restrict-template-expressions
*/

export function untyped(...args: any[]): any {
  throw new Error(`untyped(...${args})`)
}

export function simple(input: number): string {
  throw new Error(`simple(${input})`)
}

export async function simpleAsync(input: number): Promise<string> {
  throw new Error(`simpleAsync(${input})`)
}

export function complex(input: { a: number; b: string }): string {
  throw new Error(`simple({ a: ${input.a}, b: ${input.b} })`)
}

export function generic<T>(input: T): string {
  throw new Error(`generic(${input})`)
}

export function overloaded(): boolean
export function overloaded(input: number): string
export function overloaded(input?: number): string | boolean {
  throw new Error(`overloaded(${input})`)
}

export function extraArguments(first: number, second: number): string {
  throw new Error(`extraArguments(${first}, ${second})`)
}

export class SimpleClass {
  constructor(input: number) {
    throw new Error(`SimpleClass(${input})`)
  }

  simpleMethod(): string {
    throw new Error('SimpleClass.simpleMethod()')
  }
}
