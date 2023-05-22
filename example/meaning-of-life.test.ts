import { vi, describe, afterEach, it, expect } from 'vitest';
import { when } from '../src/vitest-when.ts';

import * as deepThought from './deep-thought.ts';
import * as earth from './earth.ts';
import * as subject from './meaning-of-life.ts';

vi.mock('./deep-thought.ts');
vi.mock('./earth.ts');

describe('get the meaning of life', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should get the answer and the question', async () => {
    when(deepThought.calculateAnswer).calledWith().thenResolve(42);
    when(earth.calculateQuestion).calledWith(42).thenResolve("What's 6 by 9?");

    const result = await subject.createMeaning();

    expect(result).toEqual({ question: "What's 6 by 9?", answer: 42 });
  });
});
