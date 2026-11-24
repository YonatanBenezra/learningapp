import { chunkCorpus, type CorpusDoc } from './chunking';
import { crossEncoderRerank } from './rerank';
import { retrieveRanked } from './retrieve';
import { prepareRetriever } from './retrievers';

/**
 * These specs run the pinned ONNX models (downloaded once into
 * .cache/models, see `npm run models:fetch`).
 */
const docs: CorpusDoc[] = [
  {
    id: 'leave',
    title: 'Annual leave',
    text: 'Full-time staff receive twenty-five vacation days per calendar year.',
  },
  {
    id: 'party',
    title: 'Year-end party',
    text: 'The time and place of the party are announced by HR in November. Partners may attend.',
  },
  {
    id: 'parking',
    title: 'Parking',
    text: 'Parking permits are issued by facilities for one year at a time.',
  },
];
const chunks = chunkCorpus(docs, 400, 0, 'document');
// Shares only "time" with the answer, as it does with both distractors.
const QUESTION = 'How much paid time off do employees get?';
const MODEL_TIMEOUT = 180_000;

describe('dense and hybrid retrieval (pinned bge-small)', () => {
  it(
    'finds a reworded answer that BM25 ranks below unrelated documents',
    async () => {
      expect(retrieveRanked(QUESTION, chunks, 1)[0].chunk.id).not.toBe(
        'leave:0',
      );
      const dense = await prepareRetriever(
        chunks,
        { mode: 'dense', alpha: 1 },
        [QUESTION],
      );
      expect(dense.rank(QUESTION, 1)[0].chunk.id).toBe('leave:0');
    },
    MODEL_TIMEOUT,
  );

  it(
    'hybrid alpha 0 ranks like BM25 and alpha 1 like dense',
    async () => {
      const order = (rows: { chunk: { id: string } }[]) =>
        rows.map((row) => row.chunk.id);
      const [lexical, semantic, bm25Only, denseOnly] = await Promise.all([
        prepareRetriever(chunks, { mode: 'bm25', alpha: 0 }, [QUESTION]),
        prepareRetriever(chunks, { mode: 'dense', alpha: 1 }, [QUESTION]),
        prepareRetriever(chunks, { mode: 'hybrid', alpha: 0 }, [QUESTION]),
        prepareRetriever(chunks, { mode: 'hybrid', alpha: 1 }, [QUESTION]),
      ]);
      expect(order(bm25Only.rank(QUESTION, 3))).toEqual(
        order(lexical.rank(QUESTION, 3)),
      );
      expect(order(denseOnly.rank(QUESTION, 3))).toEqual(
        order(semantic.rank(QUESTION, 3)),
      );
    },
    MODEL_TIMEOUT,
  );

  it(
    'scores the same every time',
    async () => {
      const first = await prepareRetriever(
        chunks,
        { mode: 'hybrid', alpha: 0.5 },
        [QUESTION],
      );
      const second = await prepareRetriever(
        chunks,
        { mode: 'hybrid', alpha: 0.5 },
        [QUESTION],
      );
      expect(second.rank(QUESTION, 3)).toEqual(first.rank(QUESTION, 3));
    },
    MODEL_TIMEOUT,
  );

  it('refuses a question it was not prepared for', async () => {
    const dense = await prepareRetriever(chunks, { mode: 'dense', alpha: 1 }, [
      QUESTION,
    ]);
    expect(() => dense.rank('something else', 1)).toThrow(/not prepared/);
  });
});

describe('cross-encoder rerank (pinned ms-marco MiniLM)', () => {
  it(
    'puts the reworded answer first',
    async () => {
      const firstStage = retrieveRanked(QUESTION, chunks, 3);
      expect(firstStage[0].chunk.id).not.toBe('leave:0');
      const reranked = await crossEncoderRerank(QUESTION, firstStage);
      expect(reranked[0].chunk.id).toBe('leave:0');
    },
    MODEL_TIMEOUT,
  );
});
