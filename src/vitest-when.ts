import { configureStub } from './stubs.ts';

export * from './errors.ts';

export interface StubWrapper<TArgs extends unknown[], TReturn> {
  calledWith: (...args: TArgs) => Stub<TArgs, TReturn>;
}

export interface Stub<TArgs extends unknown[], TReturn> {
  thenReturn: (...values: StubValue<TReturn>[]) => void;
  thenResolve: (...values: StubValue<Awaited<TReturn>>[]) => void;
  thenThrow: (...errors: StubValue<unknown>[]) => void;
  thenReject: (...errors: StubValue<unknown>[]) => void;
  thenDo: (...callbacks: StubValue<Callback<TArgs, TReturn>>[]) => void;
}

export type Callback<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;

export type StubValue<TValue> = TValue | typeof ONCE;

export const ONCE = Symbol('ONCE');

export const when = <TArgs extends unknown[], TReturn>(
  spy: (...args: TArgs) => TReturn
): StubWrapper<TArgs, TReturn> => {
  const behaviors = configureStub<TArgs, TReturn>(spy);

  return {
    calledWith: (...args: TArgs) => ({
      thenReturn: (...values: StubValue<TReturn>[]) => {
        behaviors.add(
          getBehaviorOptions(values).map(({ value, times }) => ({
            args,
            times,
            returnValue: value,
          }))
        );
      },
      thenResolve: (...values: StubValue<Awaited<TReturn>>[]) => {
        behaviors.add(
          getBehaviorOptions(values).map(({ value, times }) => ({
            args,
            times,
            returnValue: Promise.resolve(value) as TReturn,
          }))
        );
      },
      thenReject: (...errors: StubValue<unknown>[]) => {
        behaviors.add(
          getBehaviorOptions(errors).map(({ value, times }) => ({
            args,
            times,
            returnValue: Promise.reject(value) as TReturn,
          }))
        );
      },
      thenThrow: (...errors: StubValue<unknown>[]) => {
        behaviors.add(
          getBehaviorOptions(errors).map(({ value, times }) => ({
            args,
            times,
            throwError: value,
          }))
        );
      },
      thenDo: (...callbacks: StubValue<Callback<TArgs, TReturn>>[]) => {
        behaviors.add(
          getBehaviorOptions(callbacks).map(({ value, times }) => ({
            args,
            times,
            doCallback: value,
          }))
        );
      },
    }),
  };
};

interface BehaviorOptions<TValue> {
  value: TValue;
  times: number | undefined;
}

const getBehaviorOptions = <TValue>(
  valuesAndOptions: StubValue<TValue>[]
): BehaviorOptions<TValue>[] => {
  const once = valuesAndOptions.includes(ONCE);
  let values = valuesAndOptions.filter((value) => value !== ONCE) as TValue[];

  if (values.length === 0) {
    values = [undefined as TValue];
  }

  return values.map((value, i) => ({
    value,
    times: once || i < values.length - 1 ? 1 : undefined,
  }));
};
