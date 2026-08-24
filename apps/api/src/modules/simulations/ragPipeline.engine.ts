import type { RagChunkSize, RagPipelineBootstrap } from './simulation.types';
import { lexicalOverlap } from './vectorPlayground.engine';

export interface RagSection {
  id: string;
  text: string;
}

/** Atomic passages. The second line paraphrases the user question but states the wrong policy. */
export const RAG_SECTIONS: RagSection[] = [
  {
    id: 'intro',
    text: 'Our store policy covers returns, refunds, and subscriptions.',
  },
  {
    id: 'general-refund',
    text: 'Customers asking about a refund on downloaded software usually hear about our 30-day refund window first.',
  },
  {
    id: 'software-exception',
    text: 'Opened software licenses are non-refundable once downloaded. Contact support before purchase if unsure.',
  },
  {
    id: 'hardware',
    text: 'Hardware has a 14-day return window and must be sent back in original packaging.',
  },
  {
    id: 'subscription',
    text: 'Subscription plans can be cancelled anytime; the current billing period is not refunded.',
  },
];

export const DEFAULT_RAG_QUERY = 'Can I get a refund on downloaded software?';

const GOLD_PATTERN = /non-refundable/i;
const GOLD_TOPIC = /software|downloaded/i;
const CONFLICT_PATTERN = /30-day refund|30-day return|within 30 days/i;

export function sourceDocument(): string {
  return RAG_SECTIONS.map((section) => section.text).join('\n\n');
}

export function isGoldText(text: string): boolean {
  return GOLD_PATTERN.test(text) && GOLD_TOPIC.test(text);
}

export function isConflictText(text: string): boolean {
  return CONFLICT_PATTERN.test(text) && !isGoldText(text);
}

export interface RagChunk {
  id: string;
  text: string;
  sectionIds: string[];
  gold: boolean;
  conflict: boolean;
}

export function chunkDocument(chunkSize: RagChunkSize): RagChunk[] {
  if (chunkSize === 'small') {
    return RAG_SECTIONS.map((section) => ({
      id: section.id,
      text: section.text,
      sectionIds: [section.id],
      gold: isGoldText(section.text),
      conflict: isConflictText(section.text),
    }));
  }

  if (chunkSize === 'medium') {
    const groups = [
      [RAG_SECTIONS[0], RAG_SECTIONS[1]],
      [RAG_SECTIONS[2], RAG_SECTIONS[3]],
      [RAG_SECTIONS[4]],
    ];
    return groups.map((group, index) => {
      const text = group.map((section) => section.text).join(' ');
      return {
        id: `medium-${index}`,
        text,
        sectionIds: group.map((section) => section.id),
        gold: isGoldText(text),
        conflict: isConflictText(text),
      };
    });
  }

  const text = sourceDocument();
  return [
    {
      id: 'full-policy',
      text,
      sectionIds: RAG_SECTIONS.map((section) => section.id),
      gold: isGoldText(text),
      conflict: true,
    },
  ];
}

export function rerankBlend(cosine: number, lexicalScore: number, text: string): number {
  const lexical = lexicalScore / 100;
  let score = 0.55 * cosine + 0.45 * lexical;
  if (isGoldText(text)) score += 0.24;
  return score;
}

export function mockAnswer(retrieved: RagChunk[], grounded: boolean): string {
  if (grounded) {
    return 'Opened software licenses are non-refundable once downloaded.';
  }
  const top = retrieved[0]?.text ?? '';
  if (CONFLICT_PATTERN.test(top) || retrieved.some((chunk) => chunk.conflict)) {
    return 'Most products can be returned within 30 days, including downloaded software.';
  }
  if (/hardware/i.test(top)) {
    return 'Hardware can be returned within 14 days; software follows the same window.';
  }
  return 'Refund eligibility depends on the product category. Contact support for software returns.';
}

export function evaluateGrounding(retrieved: Array<{ text: string; gold?: boolean; conflict?: boolean }>): {
  goldInContext: boolean;
  contextConflict: boolean;
  grounded: boolean;
  evidencePrecision: number;
} {
  const goldInContext = retrieved.some((chunk) => chunk.gold ?? isGoldText(chunk.text));
  const contextConflict = retrieved.some((chunk) => chunk.conflict ?? isConflictText(chunk.text));
  const grounded = goldInContext && !contextConflict;
  const retrievedChars = retrieved.reduce((sum, chunk) => sum + chunk.text.length, 0) || 1;
  const goldChars = retrieved
    .filter((chunk) => chunk.gold ?? isGoldText(chunk.text))
    .reduce((sum, chunk) => sum + (isGoldText(chunk.text) && !isConflictText(chunk.text) ? chunk.text.length : goldSpanLength(chunk.text)), 0);
  const evidencePrecision = Math.max(0, Math.min(100, Math.round((goldChars / retrievedChars) * 100)));
  return { goldInContext, contextConflict, grounded, evidencePrecision };
}

function goldSpanLength(text: string): number {
  const match = text.match(/Opened software licenses are non-refundable once downloaded\./i);
  return match?.[0].length ?? (isGoldText(text) ? Math.min(text.length, 88) : 0);
}

export function buildHints(input: {
  chunkSize: RagChunkSize;
  topK: number;
  rerank: boolean;
  grounded: boolean;
  goldInContext: boolean;
  contextConflict: boolean;
  goldRank: number | null;
  cosineTopId?: string;
  rerankMoved?: boolean;
}): string[] {
  const hints: string[] = [];
  if (input.chunkSize === 'large') {
    hints.push('One giant chunk mixes the 30-day window with the software exception — the model blends both.');
  }
  if (!input.rerank && input.goldRank !== 1) {
    hints.push('The general refund FAQ paraphrases the question. Turn on rerank so the exception can surface.');
  }
  if (input.rerankMoved) {
    hints.push('Rerank mixed cosine with lexical overlap and boosted the exception passage.');
  }
  if (input.topK > 1 && input.contextConflict) {
    hints.push('Extra retrieved chunks stuffed the 30-day policy into context and diluted the exception.');
  }
  if (!input.goldInContext) {
    hints.push('The non-refundable software line never entered the context window.');
  }
  if (input.grounded) {
    hints.push('Context contains the exception and not the conflicting 30-day rule — the answer stays grounded.');
  }
  return hints;
}

export function getRagPipelineBootstrap(): RagPipelineBootstrap {
  return {
    defaultQuery: DEFAULT_RAG_QUERY,
    sourcePreview: sourceDocument(),
    sections: RAG_SECTIONS,
    chunkSizeOptions: [
      { value: 'small', label: 'Sentence', chars: 120 },
      { value: 'medium', label: 'Paired', chars: 260 },
      { value: 'large', label: 'Full doc', chars: sourceDocument().length },
    ],
    topKRange: { min: 1, max: 5, default: 1 },
    defaultConfig: { chunkSize: 'medium', topK: 1, rerank: false },
    sampleQueries: [
      DEFAULT_RAG_QUERY,
      'What is the return window for hardware?',
      'Can I cancel my subscription anytime?',
    ],
  };
}

export { lexicalOverlap };
