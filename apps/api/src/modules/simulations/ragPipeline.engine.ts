import type { RagPipelineRunResult, SimulationSubmitResult } from './simulation.types';

const SOURCE_DOCUMENT = `Our store policy covers returns and subscriptions.

We offer a 30-day return window for most physical products in original condition.

Opened software licenses are non-refundable once downloaded. Contact support before purchase if unsure.

Hardware must be returned in original packaging within 14 days of delivery.

Subscription plans can be cancelled anytime; the current billing period is not refunded.`;

const DEFAULT_QUERY = 'Can I get a refund on downloaded software?';

type ChunkSize = 'small' | 'medium' | 'large';

interface RagChunk {
  id: string;
  text: string;
  baseScore: number;
}

const SMALL_CHUNKS: RagChunk[] = [
  { id: 'intro', text: 'Our store policy covers returns and subscriptions.', baseScore: 18 },
  {
    id: 'physical-30',
    text: 'We offer a 30-day return window for most physical products in original condition.',
    baseScore: 62,
  },
  {
    id: 'software',
    text: 'Opened software licenses are non-refundable once downloaded. Contact support before purchase if unsure.',
    baseScore: 88,
  },
  {
    id: 'hardware-14',
    text: 'Hardware must be returned in original packaging within 14 days of delivery.',
    baseScore: 34,
  },
  {
    id: 'subscription',
    text: 'Subscription plans can be cancelled anytime; the current billing period is not refunded.',
    baseScore: 28,
  },
];

const MEDIUM_CHUNKS: RagChunk[] = [
  {
    id: 'medium-policy',
    text: `${SMALL_CHUNKS[0].text} ${SMALL_CHUNKS[1].text}`,
    baseScore: 70,
  },
  {
    id: 'medium-products',
    text: `${SMALL_CHUNKS[2].text} ${SMALL_CHUNKS[3].text}`,
    baseScore: 66,
  },
  {
    id: 'medium-subscription',
    text: SMALL_CHUNKS[4].text,
    baseScore: 24,
  },
];

const LARGE_CHUNKS: RagChunk[] = [{ id: 'full-policy', text: SOURCE_DOCUMENT.trim(), baseScore: 58 }];

function chunksForSize(chunkSize: ChunkSize): RagChunk[] {
  switch (chunkSize) {
    case 'small':
      return SMALL_CHUNKS;
    case 'medium':
      return MEDIUM_CHUNKS;
    default:
      return LARGE_CHUNKS;
  }
}

function applyRerank(chunks: Array<RagChunk & { score: number }>): Array<RagChunk & { score: number }> {
  return [...chunks]
    .map((chunk) => {
      const text = chunk.text.toLowerCase();
      const boost =
        text.includes('software') && text.includes('non-refundable') ? 18 : text.includes('software') ? 8 : 0;
      return { ...chunk, score: chunk.score + boost };
    })
    .sort((a, b) => b.score - a.score);
}

function rankChunks(chunkSize: ChunkSize, topK: number, rerank: boolean) {
  const ranked = chunksForSize(chunkSize).map((chunk) => ({ ...chunk, score: chunk.baseScore }));
  const sorted = rerank ? applyRerank(ranked) : [...ranked].sort((a, b) => b.score - a.score);
  const retrieved = sorted.slice(0, Math.min(5, Math.max(1, topK)));
  return { sorted, retrieved };
}

function mockAnswer(topText: string, grounded: boolean): string {
  if (grounded) {
    return 'Opened software licenses are non-refundable once downloaded.';
  }
  if (/30-day|physical products/i.test(topText)) {
    return 'Most products can be returned within 30 days, including downloaded software.';
  }
  if (/hardware/i.test(topText)) {
    return 'Hardware can be returned within 14 days; software follows the same window.';
  }
  return 'Refund eligibility depends on the product category. Contact support for software returns.';
}

function evaluateRun(chunkSize: ChunkSize, topK: number, rerank: boolean): RagPipelineRunResult {
  const { sorted, retrieved } = rankChunks(chunkSize, topK, rerank);
  const top = retrieved[0];
  const grounded =
    Boolean(top?.text.toLowerCase().includes('non-refundable')) &&
    top.text.toLowerCase().includes('software');

  const hints: string[] = [];
  if (!rerank && chunkSize === 'medium') {
    hints.push('Medium chunks merge software with other lines — try enabling rerank.');
  }
  if (topK > 3) {
    hints.push('A large top-k can dilute the best passage with generic return policy text.');
  }
  if (chunkSize === 'large') {
    hints.push('One giant chunk mixes 30-day physical returns with non-refundable software.');
  }
  if (!grounded && retrieved.some((chunk) => chunk.text.toLowerCase().includes('non-refundable'))) {
    hints.push('The right passage is retrieved but not ranked first — adjust rerank or top-k.');
  }

  return {
    config: { chunkSize, topK, rerank },
    chunks: sorted.map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      score: chunk.score,
      retrieved: retrieved.some((item) => item.id === chunk.id),
    })),
    retrievedContext: retrieved.map((chunk) => chunk.text).join('\n\n'),
    answer: mockAnswer(top?.text ?? '', grounded),
    grounded,
    hints,
    defaultQuery: DEFAULT_QUERY,
  };
}

function scoreConfig(chunkSize: ChunkSize, topK: number, rerank: boolean, grounded: boolean): number {
  let score = grounded ? 78 : 35;
  if (rerank) score += 10;
  if (chunkSize === 'small' || chunkSize === 'medium') score += 6;
  if (topK <= 3) score += 6;
  if (chunkSize === 'large') score -= 12;
  if (topK > 3) score -= 10;
  if (!rerank) score -= 8;
  return Math.max(0, Math.min(100, score));
}

export function getRagPipelineBootstrap() {
  return {
    defaultQuery: DEFAULT_QUERY,
    sourcePreview: SOURCE_DOCUMENT.trim(),
    chunkSizeOptions: [
      { value: 'small' as const, label: 'Small (~1 sentence)', chars: 120 },
      { value: 'medium' as const, label: 'Medium (~2 sentences)', chars: 260 },
      { value: 'large' as const, label: 'Large (full document)', chars: SOURCE_DOCUMENT.length },
    ],
    topKRange: { min: 1, max: 5, default: 1 },
    defaultConfig: { chunkSize: 'medium' as const, topK: 1, rerank: false },
  };
}

export function runRagPipeline(
  query: string,
  chunkSize: ChunkSize = 'medium',
  topK = 1,
  rerank = false,
): RagPipelineRunResult {
  void query;
  return evaluateRun(chunkSize, topK, rerank);
}

export function submitRagPipeline(
  query: string,
  chunkSize: ChunkSize,
  topK: number,
  rerank: boolean,
): SimulationSubmitResult {
  void query;
  const run = evaluateRun(chunkSize, topK, rerank);
  const passed = run.grounded && rerank && topK <= 3 && chunkSize !== 'large';
  const score = scoreConfig(chunkSize, topK, rerank, run.grounded);

  const feedback = passed
    ? 'Grounded answer. Reranking surfaced the software policy chunk and the model stayed within retrieved context.'
    : !rerank && chunkSize === 'medium'
      ? 'The pipeline retrieved the wrong leading chunk. Enable rerank so the software passage ranks first.'
      : chunkSize === 'large'
        ? 'Oversized chunks blend conflicting policies — the mock model over-generalized the 30-day rule to software.'
        : !run.grounded
          ? 'Answer is not grounded. Tune chunk size, top-k, and rerank until the software non-refund line leads retrieval.'
          : 'Close, but tighten top-k (≤3) and avoid full-document chunking for sharper retrieval.';

  return {
    passed,
    score,
    feedback,
    output: JSON.stringify(
      {
        answer: run.answer,
        grounded: run.grounded,
        config: run.config,
        retrievedContext: run.retrievedContext,
      },
      null,
      2,
    ),
  };
}
