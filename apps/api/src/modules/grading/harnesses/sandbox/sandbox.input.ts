import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from '../rag/chunking';
import type { HiddenItem } from '../rag/rag.types';

export type SandboxLearnerQuestion = {
  id: string;
  question: string;
};

export type SandboxLearnerInput = {
  corpus: CorpusDoc[];
  questions: SandboxLearnerQuestion[];
};

export function materialiseLearnerInput(
  docs: CorpusDoc[],
  hidden: HiddenItem[],
): SandboxLearnerInput {
  const questions = hidden
    .filter((item) => !isHiddenCanary(item.question))
    .map((item) => ({ id: item.id, question: item.question }));
  return {
    corpus: docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      text: doc.text,
    })),
    questions,
  };
}

export function learnerInputJson(
  docs: CorpusDoc[],
  hidden: HiddenItem[],
): string {
  return JSON.stringify(materialiseLearnerInput(docs, hidden));
}
