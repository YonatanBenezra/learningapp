import type { CuratedModuleSeed } from './curatedCourse.constants';

function section(title: string, paragraphs: string[]) {
  return {
    title,
    body: paragraphs.join('\n\n'),
  };
}

export const CURATED_COURSE_META = {
  title: 'RAG & LLM Engineering — 5 Hour Lab',
  description:
    'A guided hands-on path: read core concepts, run all four AI simulations, and practice with curated MCQ exercises.',
  category: 'Generative AI',
  level: 'beginner' as const,
  estimatedHours: 5,
  topics: [
    'Prompt Engineering',
    'Embeddings & retrieval',
    'RAG pipeline tuning',
    'Guardrails & production safety',
    'Knowledge checks',
  ],
};

export const CURATED_COURSE_MODULES: CuratedModuleSeed[] = [
  {
    title: 'Prompt Engineering',
    domain: 'general',
    lessons: [
      {
        title: 'JSON-only prompts',
        estimatedMinutes: 15,
        content: {
          summary:
            'Learn how to instruct an LLM to return structured JSON — the same skill you need when building APIs and evaluation pipelines.',
          sections: [
            section('Why structure matters', [
              'Downstream systems cannot parse free-form prose reliably. Production apps expect predictable keys such as title and summary.',
              'Clear format rules in the prompt reduce retries, parsing errors, and silent failures in your pipeline.',
            ]),
            section('Mission vs fixed input', [
              'Mission describes the grading goal: what a correct answer must contain.',
              'Fixed input is the data the model must process — you do not change it; you write instructions for how to handle it.',
            ]),
            section('Common mistakes', [
              'Asking for JSON but allowing markdown fences or extra commentary.',
              'Omitting required keys or using synonyms like headline instead of title.',
            ]),
            section('Before the lab', [
              'In the next step you will open Prompt Lab, write a prompt, run a live model, and submit for grading.',
              'Aim for JSON only with keys title and summary grounded in the product review.',
            ]),
          ],
          keyPoints: [
            'Mission = success criteria; fixed input = raw material.',
            'JSON-only means no markdown wrappers or extra prose.',
            'Required keys must match the rubric exactly.',
            'Prompt Lab grades structure and grounding.',
          ],
        },
      },
      {
        title: 'Lab — Prompt Lab',
        estimatedMinutes: 35,
        content: {
          summary:
            'Open Prompt Lab, craft a prompt for the fixed product review, run the model, and submit when output passes structural checks.',
          sections: [
            section('What you will do', [
              'Run a live LLM with your prompt against a fixed product review.',
              'Inspect the model output for valid JSON with title and summary keys.',
            ]),
            section('Pass criteria', [
              'Output must be parseable JSON without markdown fences.',
              'Summary should reflect facts from the review, not invented details.',
            ]),
            section('Tips', [
              'State “JSON only” explicitly and forbid markdown.',
              'Name the keys title and summary in the instruction.',
            ]),
            section('When finished', [
              'Return here and mark this lesson complete, then continue to the knowledge-check problems.',
            ]),
          ],
          keyPoints: [
            'Use Prompt Lab toolbar: Run then Submit.',
            'Read Mission and Fixed input cards before writing.',
            'Iterate if structural score is low.',
          ],
          activity: {
            kind: 'simulation',
            simulationSlug: 'prompt-lab',
            simulationTitle: 'Prompt Lab',
            instructions: 'Pass the simulation, then mark this lesson complete.',
          },
        },
      },
      {
        title: 'Knowledge check — Prompt Engineering',
        estimatedMinutes: 15,
        content: {
          summary: 'Solidify prompt patterns with three MCQ problems on clarity, few-shot, and chain-of-thought.',
          sections: [
            section('How to practice', [
              'Open each problem below in a new tab, submit your answer, and read the feedback.',
              'You need conceptual understanding — not just the lab pass.',
            ]),
            section('Topics covered', [
              'JSON-only instructions, few-shot examples, and when chain-of-thought helps.',
            ]),
            section('After problems', [
              'Mark complete when you have attempted all three. Review any missed answers.',
            ]),
            section('Next module', [
              'Module 2 covers embeddings and semantic chunk retrieval with Vector Playground.',
            ]),
          ],
          keyPoints: [
            'Few-shot shows desired input/output patterns.',
            'Chain-of-thought helps multi-step reasoning tasks.',
            'Clear format rules beat vague “be smart” instructions.',
          ],
          activity: {
            kind: 'problems',
            problemSlugs: ['prompt-engineering-1', 'prompt-engineering-2', 'prompt-engineering-3'],
            instructions: 'Complete all three problems, then mark this lesson done.',
          },
        },
      },
    ],
  },
  {
    title: 'Embeddings & Retrieval',
    domain: 'general',
    lessons: [
      {
        title: 'Embeddings and cosine similarity',
        estimatedMinutes: 20,
        content: {
          summary:
            'Embeddings turn text into vectors so you can rank passages by meaning — the retrieval step in every RAG system.',
          sections: [
            section('What embeddings capture', [
              'Similar meanings map to nearby vectors even when wording differs.',
              'This enables semantic search beyond keyword matching.',
            ]),
            section('Cosine similarity', [
              'Cosine similarity compares vector direction, which is standard for normalized embedding indexes.',
              'Higher scores mean the chunk is more relevant to the query.',
            ]),
            section('False retrieval', [
              'Generic chunks can score moderately high without answering the question.',
              'Always read chunk text, not only the numeric score.',
            ]),
            section('Next lab', [
              'Vector Playground lets you query a mini index and pick the best chunk for a RAG hallucination question.',
            ]),
          ],
          keyPoints: [
            'Embeddings encode semantic meaning.',
            'Cosine similarity ranks retrieved chunks.',
            'Top score should align with grounding language for RAG tasks.',
          ],
        },
      },
      {
        title: 'Lab — Vector Playground',
        estimatedMinutes: 35,
        content: {
          summary: 'Run embedding search, compare similarity scores, and select the chunk that best reduces hallucinations.',
          sections: [
            section('Task', [
              'Which knowledge chunk best explains reducing hallucinations in a RAG system?',
            ]),
            section('Workflow', [
              'Write a query, run search, review ranked results, select the best chunk, submit.',
            ]),
            section('Pass criteria', [
              'Your pick must match the highest cosine similarity chunk for the query.',
            ]),
            section('When finished', [
              'Mark this lesson complete after a successful submit.',
            ]),
          ],
          keyPoints: [
            'Expand the knowledge base if you need full chunk text.',
            'Use sample queries to explore different rankings.',
            'Compare #1 vs #2 score gap when matches are close.',
          ],
          activity: {
            kind: 'simulation',
            simulationSlug: 'vector-playground',
            simulationTitle: 'Vector Playground',
            instructions: 'Pass the chunk selection task, then mark complete.',
          },
        },
      },
      {
        title: 'Knowledge check — Embeddings',
        estimatedMinutes: 15,
        content: {
          summary: 'Practice embedding and hybrid retrieval concepts with targeted MCQs.',
          sections: [
            section('Problems', [
              'Work through cosine similarity and hybrid search questions.',
            ]),
            section('Connection to RAG', [
              'Bad retrieval causes hallucinations even with a perfect prompt.',
            ]),
            section('Review', [
              'Re-read missed questions before continuing.',
            ]),
            section('Up next', [
              'Module 3 connects retrieval settings to grounded answers in RAG Pipeline.',
            ]),
          ],
          keyPoints: [
            'Cosine similarity measures directional alignment.',
            'Hybrid search blends dense and keyword retrieval.',
          ],
          activity: {
            kind: 'problems',
            problemSlugs: ['embeddings-1', 'rag-basics-3'],
            instructions: 'Finish both problems, then mark complete.',
          },
        },
      },
    ],
  },
  {
    title: 'RAG Pipeline',
    domain: 'general',
    lessons: [
      {
        title: 'Chunking, top-k, and reranking',
        estimatedMinutes: 20,
        content: {
          summary:
            'RAG quality depends on how documents are split, how many chunks you retrieve, and whether you rerank results.',
          sections: [
            section('Chunk size tradeoffs', [
              'Small chunks improve precision; large chunks preserve context but add noise.',
            ]),
            section('Top-k', [
              'Higher k increases recall but can dilute the context window with irrelevant text.',
            ]),
            section('Reranking', [
              'Reranking reorders retrieved chunks so the most grounded passage surfaces first.',
            ]),
            section('Lab preview', [
              'RAG Pipeline simulation shows grounded vs ungrounded answers when settings change.',
            ]),
          ],
          keyPoints: [
            'Chunking affects what embeddings capture.',
            'Top-k controls breadth of retrieval.',
            'Rerank can fix ordering without re-embedding.',
          ],
        },
      },
      {
        title: 'Lab — RAG Pipeline',
        estimatedMinutes: 40,
        content: {
          summary: 'Tune chunk size, top-k, and rerank — then ask a fixed policy question and verify grounding.',
          sections: [
            section('Goal', [
              'Produce a grounded answer that cites non-refundable policy language, not a hallucinated refund window.',
            ]),
            section('Controls', [
              'Try chunk size, top-k, and rerank combinations; run before submit.',
            ]),
            section('Pass hint', [
              'Medium chunks with rerank enabled typically surface the correct policy clause.',
            ]),
            section('Finish', [
              'Submit when grounded is true, then mark this lesson complete.',
            ]),
          ],
          keyPoints: [
            'Inspect retrieved context, not only the final answer.',
            'Ungrounded answers often mean wrong chunk won retrieval.',
          ],
          activity: {
            kind: 'simulation',
            simulationSlug: 'rag-pipeline',
            simulationTitle: 'RAG Pipeline',
            instructions: 'Pass with a grounded answer, then mark complete.',
          },
        },
      },
      {
        title: 'Knowledge check — RAG & LLMs',
        estimatedMinutes: 20,
        content: {
          summary: 'MCQs on RAG purpose, chunking, and LLM inference basics.',
          sections: [
            section('Problems included', [
              'RAG fundamentals, chunking strategy, and next-token prediction.',
            ]),
            section('Why it matters', [
              'Pipeline tuning and LLM basics together explain most production RAG incidents.',
            ]),
            section('Pace', [
              'About 5–7 minutes per question with feedback.',
            ]),
            section('Next', [
              'Final module covers guardrails and agent safety.',
            ]),
          ],
          keyPoints: [
            'RAG grounds answers with external documents.',
            'Chunking balances precision and context limits.',
            'LLMs generate token by token autoregressively.',
          ],
          activity: {
            kind: 'problems',
            problemSlugs: ['rag-basics-1', 'rag-basics-2', 'llm-fundamentals-1'],
            instructions: 'Complete all three problems, then mark done.',
          },
        },
      },
    ],
  },
  {
    title: 'Safety & Production',
    domain: 'general',
    lessons: [
      {
        title: 'Guardrails in production',
        estimatedMinutes: 20,
        content: {
          summary: 'Layered defenses — input filters, system prompts, and output validation — reduce jailbreaks and unsafe outputs.',
          sections: [
            section('Threat model', [
              'Users may attempt prompt injection, data exfiltration, or harmful requests.',
            ]),
            section('Defense in depth', [
              'Block bad inputs early, constrain behavior in system prompts, validate outputs before showing users.',
            ]),
            section('Agent safety', [
              'Tools that send email or modify data need scoped permissions and human approval.',
            ]),
            section('Lab next', [
              'Guardrails Simulator lets you configure layers against adversarial inputs.',
            ]),
          ],
          keyPoints: [
            'No single layer is sufficient.',
            'Output validation catches leaks after generation.',
            'Production agents need permission boundaries.',
          ],
        },
      },
      {
        title: 'Lab — Guardrails Simulator',
        estimatedMinutes: 35,
        content: {
          summary: 'Enable input filter, safety system prompt, and output validation to block a jailbreak scenario.',
          sections: [
            section('Scenario', [
              'A user attempts to extract hidden system instructions.',
            ]),
            section('Your task', [
              'Configure all three guardrail layers and verify the attack is blocked.',
            ]),
            section('Pass criteria', [
              'Submit when the simulator reports safe with blocked input or refusal.',
            ]),
            section('Wrap-up', [
              'Mark complete after pass — one knowledge-check lesson remains.',
            ]),
          ],
          keyPoints: [
            'Try running with layers off first to see the leak.',
            'Then enable layers incrementally to see which stops the attack.',
          ],
          activity: {
            kind: 'simulation',
            simulationSlug: 'guardrails',
            simulationTitle: 'Guardrails Simulator',
            instructions: 'Pass with all layers enabled, then mark complete.',
          },
        },
      },
      {
        title: 'Knowledge check — Agents & MLOps',
        estimatedMinutes: 20,
        content: {
          summary: 'Close the course with MCQs on tool use, ReAct, agent safety, and model registry basics.',
          sections: [
            section('Problems', [
              'Agents, ReAct, responsible tool use, and ML model registry.',
            ]),
            section('Course completion', [
              'After these problems you will have finished all four simulations and the curated exercise set.',
            ]),
            section('Celebrate', [
              'You completed the 5-hour RAG & LLM engineering lab path.',
            ]),
            section('Keep practicing', [
              'Return to Problems and Simulations anytime for spaced repetition.',
            ]),
          ],
          keyPoints: [
            'Tools extend LLMs with structured actions.',
            'ReAct interleaves reasoning and actions.',
            'Model registry tracks deployment lineage.',
          ],
          activity: {
            kind: 'problems',
            problemSlugs: ['agents-1', 'agents-2', 'agents-3', 'mlops-1'],
            instructions: 'Complete all four problems to finish the course exercises.',
          },
        },
      },
    ],
  },
];
