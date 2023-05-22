/**
 * Get function arguments and return value types.
 *
 * Support for overloaded functions, thanks to @Shakeskeyboarde
 * https://github.com/microsoft/TypeScript/issues/14107#issuecomment-1146738780
 */

import type { SpyInstance } from 'vitest';

/** Any function, for use in `extends` */
export type AnyFunction = (...args: never[]) => unknown;

/** Acceptable arguments for a function.*/
export type AllParameters<TFunc extends AnyFunction> =
  TFunc extends SpyInstance<infer TArgs, unknown>
    ? TArgs
    : Parameters<ToOverloads<TFunc>>;

/** The return type of a function, given the actual arguments used.*/
export type ReturnTypeFromArgs<
  TFunc extends AnyFunction,
  TArgs extends unknown[]
> = TFunc extends SpyInstance<unknown[], infer TReturn>
  ? TReturn
  : ExtractReturn<ToOverloads<TFunc>, TArgs>;

/** Given a functions and actual arguments used, extract the return type. */
type ExtractReturn<
  TFunc extends AnyFunction,
  TArgs extends unknown[]
> = TFunc extends (...args: infer TFuncArgs) => infer TFuncReturn
  ? TArgs extends TFuncArgs
    ? TFuncReturn
    : never
  : never;

/** Transform an overloaded function into a union of functions. */
type ToOverloads<TFunc extends AnyFunction> = Exclude<
  OverloadUnion<(() => never) & TFunc>,
  TFunc extends () => never ? never : () => never
>;

/** Recursively extract functions from an overload into a union. */
type OverloadUnion<TFunc, TPartialOverload = unknown> = TFunc extends (
  ...args: infer TArgs
) => infer TReturn
  ? TPartialOverload extends TFunc
    ? never
    :
        | OverloadUnion<
            TPartialOverload & TFunc,
            TPartialOverload &
              ((...args: TArgs) => TReturn) &
              OverloadProps<TFunc>
          >
        | ((...args: TArgs) => TReturn)
  : never;

/** Properties attached to a function. */
type OverloadProps<TFunc> = Pick<TFunc, keyof TFunc>;
