export interface BehaviorEntry<TArgs extends unknown[], TReturn> {
  args: TArgs;
  returnValue?: TReturn;
  throwError?: unknown | undefined;
  doCallback?: ((...args: TArgs) => TReturn) | undefined;
  times?: number | undefined;
}

export interface Behaviors<TArgs extends unknown[], TReturn> {
  add: (behaviors: BehaviorEntry<TArgs, TReturn>[]) => void;
  execute: (args: TArgs) => TReturn;
}

export const createBehaviors = <TArgs extends unknown[], TReturn>(): Behaviors<
  TArgs,
  TReturn
> => {
  const behaviorStack: BehaviorEntry<TArgs, TReturn>[] = [];

  return {
    add: (behaviors) => behaviorStack.unshift(...behaviors),
    execute: (args) => {
      const behavior = behaviorStack
        .filter((b) => behaviorAvailable(b))
        .find(behaviorHasArgs(args));

      if (behavior?.times !== undefined) {
        behavior.times -= 1;
      }

      if (behavior?.throwError) {
        throw behavior.throwError as Error;
      }

      if (behavior?.doCallback) {
        return behavior.doCallback(...args);
      }

      return behavior?.returnValue as TReturn;
    },
  };
};

const behaviorAvailable = <TArgs extends unknown[], TReturn>(
  behavior: BehaviorEntry<TArgs, TReturn>
): boolean => {
  return behavior.times === undefined || behavior.times > 0;
};

const behaviorHasArgs = <TArgs extends unknown[], TReturn>(args: TArgs) => {
  return (behavior: BehaviorEntry<TArgs, TReturn>): boolean => {
    let i = 0;

    while (i < args.length || i < behavior.args.length) {
      if (args[i] !== behavior.args[i]) {
        return false;
      }

      i += 1;
    }

    return true;
  };
};
