import type { Mock as Spy } from 'vitest';
import { createBehaviors, type Behaviors } from './behaviors.ts';
import { NotAMockFunctionError } from './errors.ts';

const BEHAVIORS_KEY = Symbol('behaviors');

type BaseSpyImplementation<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;

interface WhenStubImplementation<TArgs extends unknown[], TReturn>
  extends BaseSpyImplementation<TArgs, TReturn> {
  [BEHAVIORS_KEY]: Behaviors<TArgs, TReturn>;
}

export const configureStub = <TArgs extends unknown[], TReturn>(
  maybeSpy: unknown
): Behaviors<TArgs, TReturn> => {
  const spy = validateSpy<TArgs, TReturn>(maybeSpy);
  let implementation = spy.getMockImplementation() as
    | BaseSpyImplementation<TArgs, TReturn>
    | WhenStubImplementation<TArgs, TReturn>
    | undefined;

  if (!implementation || !(BEHAVIORS_KEY in implementation)) {
    const behaviors = createBehaviors<TArgs, TReturn>();

    implementation = Object.assign(
      (...args: TArgs) => behaviors.execute(args),
      { [BEHAVIORS_KEY]: behaviors }
    );

    spy.mockImplementation(implementation);

    return behaviors;
  }

  return implementation[BEHAVIORS_KEY];
};

const validateSpy = <TArgs extends unknown[], TReturn>(
  maybeSpy: unknown
): Spy<TArgs, TReturn> => {
  if (
    typeof maybeSpy === 'function' &&
    'mockImplementation' in maybeSpy &&
    typeof maybeSpy.mockImplementation === 'function' &&
    'getMockImplementation' in maybeSpy &&
    typeof maybeSpy.getMockImplementation === 'function'
  ) {
    return maybeSpy as Spy<TArgs, TReturn>;
  }

  throw new NotAMockFunctionError(maybeSpy);
};
