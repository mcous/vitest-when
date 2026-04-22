/** Common type definitions. */
import type { MockedClass, MockedFunction, MockInstance } from 'vitest'

/** Any function. */
export type AnyFunction = (...args: any[]) => any

/** Any constructor. */
export type AnyConstructor = new (...args: any[]) => any

/** Any mockable interface. */
export type AnyMockable = AnyFunction | AnyConstructor

/** Any mock instance, either of a function or a constructor. */
export type AnyMockInstance = MockInstance<AnyMockable>

/** Extract parameters from either a function or constructor. */
export type ParametersOf<TFunc extends AnyMockable> =
  TFunc extends AnyConstructor
    ? ConstructorParameters<TFunc>
    : TFunc extends AnyFunction
      ? Parameters<TFunc>
      : never

/** An arguments list, optionally without every argument specified */
export type ArgumentsSpec<
  TArgs extends any[],
  TOptions extends { ignoreExtraArgs?: boolean } | undefined,
> = TOptions extends { ignoreExtraArgs: true }
  ? TArgs extends [infer Head, ...infer Tail]
    ? [] | [Head] | [Head, ...ArgumentsSpec<Tail, TOptions>]
    : TArgs
  : TArgs

/** Extract return type from either a function or constructor */
export type ReturnTypeOf<TFunc extends AnyMockable> =
  TFunc extends AnyConstructor
    ? InstanceType<TFunc>
    : TFunc extends AnyFunction
      ? ReturnType<TFunc>
      : never

/** Convert a function or constructor type into a function type. */
export type AsFunction<TFunc extends AnyMockable> = TFunc extends AnyConstructor
  ? ConstructorImplementation<TFunc>
  : TFunc extends AnyFunction
    ? TFunc
    : never

/** Acceptable implementation signatures for a constructor */
export type ConstructorImplementation<
  TFunc extends AnyConstructor = AnyConstructor,
> =
  | (new (...args: ConstructorParameters<TFunc>) => InstanceType<TFunc>)
  | ((this: InstanceType<TFunc>, ...args: ConstructorParameters<TFunc>) => void)

/** A mocked function or constructor. */
export type Mock<TFunc extends AnyMockable> = TFunc extends AnyConstructor
  ? MockedClass<TFunc>
  : TFunc extends AnyFunction
    ? MockedFunction<TFunc>
    : never

export type { MockInstance } from 'vitest'
