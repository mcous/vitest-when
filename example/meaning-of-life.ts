import { calculateAnswer } from './deep-thought.ts';
import { calculateQuestion } from './earth.ts';

export interface Meaning {
  question: string;
  answer: number;
}

export const createMeaning = async (): Promise<Meaning> => {
  const answer = await calculateAnswer();
  const question = await calculateQuestion(answer);

  return { question, answer };
};
