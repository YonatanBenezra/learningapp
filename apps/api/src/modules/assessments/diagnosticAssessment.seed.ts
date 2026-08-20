import { DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT } from '@aieng/shared';
import type { SkillMcqQuestion } from './skillAssessment.schema';
import { shuffleMcqOptions } from './mcqOptions';

interface DiagnosticSeedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

/** Curated AI-engineering diagnostic — instant load, no AI generation wait. */
const DIAGNOSTIC_QUESTIONS: DiagnosticSeedQuestion[] = [
  {
    question:
      'Which prompt best follows the instruction to return JSON only with keys "title" and "summary"?',
    options: [
      'Write about AI and make it sound smart.',
      'Return JSON with keys title and summary for this article: …',
      'Explain AI in 500 words, then add a title at the end.',
      'Summarize this but feel free to use markdown.',
    ],
    correctAnswer: 'Return JSON with keys title and summary for this article: …',
  },
  {
    question: 'Autoregressive LLMs generate text by repeatedly predicting…',
    options: ['The entire document at once', 'The next token', 'A random seed', 'User embeddings'],
    correctAnswer: 'The next token',
  },
  {
    question: 'Lowering sampling temperature during inference generally makes outputs…',
    options: [
      'More random and diverse',
      'More deterministic and focused',
      'Slower to train',
      'Longer context windows',
    ],
    correctAnswer: 'More deterministic and focused',
  },
  {
    question: 'Retrieval-Augmented Generation (RAG) mainly helps LLMs by…',
    options: [
      'Replacing the need for any model weights',
      'Grounding answers with retrieved external documents',
      'Eliminating latency entirely',
      'Training the model from scratch each query',
    ],
    correctAnswer: 'Grounding answers with retrieved external documents',
  },
  {
    question: 'When building a RAG pipeline, chunking documents is important because…',
    options: [
      'It guarantees 100% factual answers',
      'It balances retrieval precision with context size limits',
      'It removes the need for embeddings',
      'It disables duplicate detection',
    ],
    correctAnswer: 'It balances retrieval precision with context size limits',
  },
  {
    question: 'Cosine similarity between embedding vectors measures…',
    options: [
      'The angle between vectors (directional similarity)',
      'The exact byte length of documents',
      'GPU temperature',
      'SQL join performance',
    ],
    correctAnswer: 'The angle between vectors (directional similarity)',
  },
  {
    question: 'In an LLM agent, a "tool" is best described as…',
    options: [
      'A fixed hard-coded if/else branch only',
      'An external capability the model can invoke via structured calls',
      'A GPU kernel',
      'A database migration script',
    ],
    correctAnswer: 'An external capability the model can invoke via structured calls',
  },
  {
    question: 'The ReAct pattern interleaves reasoning traces with…',
    options: ['Random sampling', 'Actions and observations', 'Gradient updates', 'Token pruning only'],
    correctAnswer: 'Actions and observations',
  },
  {
    question: 'BLEU is often insufficient alone for LLM evaluation because…',
    options: [
      'It captures semantic correctness and safety well',
      'It measures n-gram overlap, not meaning or factuality',
      'It requires no reference text',
      'It only works on code',
    ],
    correctAnswer: 'It measures n-gram overlap, not meaning or factuality',
  },
  {
    question: 'Using an LLM as a judge is useful but requires…',
    options: [
      'No calibration or human spot checks',
      'Careful rubrics and periodic human validation',
      'Disabling all metrics',
      'Only multiple-choice questions',
    ],
    correctAnswer: 'Careful rubrics and periodic human validation',
  },
  {
    question: 'An ML model registry primarily tracks…',
    options: [
      'Only frontend bundle sizes',
      'Versioned models, metadata, and deployment lineage',
      'User passwords',
      'CSS theme tokens',
    ],
    correctAnswer: 'Versioned models, metadata, and deployment lineage',
  },
  {
    question: 'Shadow deployment means…',
    options: [
      'Replacing production traffic immediately',
      'Running a new model on duplicate traffic without serving its outputs to users',
      'Deleting the old model before testing',
      'Training only on synthetic data',
    ],
    correctAnswer:
      'Running a new model on duplicate traffic without serving its outputs to users',
  },
];

export function buildDiagnosticQuestions(): SkillMcqQuestion[] {
  const picked = DIAGNOSTIC_QUESTIONS.slice(0, DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT);
  if (picked.length !== DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT) {
    throw new Error(
      `Expected ${DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT} diagnostic questions, got ${picked.length}`,
    );
  }

  return picked.map((q) => {
    const { options, correctAnswer } = shuffleMcqOptions(q.options, q.correctAnswer);
    return {
      question: q.question,
      type: 'mcq' as const,
      options,
      correctAnswer,
    };
  });
}
