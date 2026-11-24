import type { CorpusDoc } from './chunking';
import { gradeR2, newNames } from './r2.grade';
import type { HiddenItem } from './rag.types';

const city = (name: string, cap: number): CorpusDoc => ({
  id: `travel-${name.toLowerCase()}`,
  title: `Business travel: ${name}`,
  text: `Hotels in ${name} may cost at most ${cap} euros a night on business trips.`,
});
const event = (name: string, where: string): CorpusDoc => ({
  id: `event-${name.split(' ')[0]}`,
  title: `The ${name}`,
  text: `This year the ${name} takes place in ${where} in March. Registration opens six weeks before.`,
});
const docs: CorpusDoc[] = [
  event('design summit', 'Porto'),
  event('sales kickoff', 'Munich'),
  event('security week', 'Vienna'),
  city('Porto', 140),
  city('Munich', 190),
  city('Vienna', 165),
];
const hidden: HiddenItem[] = [
  {
    id: 'h1',
    question: 'What is the nightly hotel limit for the design summit?',
    answerable: true,
    goldAnswer: '140 euros',
    goldDocId: 'travel-porto',
    goldSpan: 'Hotels in Porto may cost at most 140 euros a night',
    evidence: [
      { docId: 'event-design', span: 'the design summit takes place in Porto' },
      {
        docId: 'travel-porto',
        span: 'Hotels in Porto may cost at most 140 euros a night',
      },
    ],
  },
];
const gates = [
  { metric: 'recall@k', value: 1 },
  { metric: 'mean_prompt_tokens', value: 1000 },
];

describe('R2 multi-hop', () => {
  it('one search finds the event but not its city', async () => {
    const result = await gradeR2(
      { topK: 1, rerank: false, chunkSize: 400 },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.metrics.recall_at_k.value).toBe(0);
    expect(result.scorecard.breakdown).toMatchObject({
      diagnosis: { 'answer-passage-missing': 1 },
    });
  });

  it('a second hop that carries the new name finds the city', async () => {
    const result = await gradeR2(
      { topK: 1, rerank: false, chunkSize: 400, hops: 2, hopQuery: 'entities' },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.verdict).toBe('pass');
  });

  it('pasting the whole passage drifts to similar event pages', async () => {
    const result = await gradeR2(
      { topK: 1, rerank: false, chunkSize: 400, hops: 2, hopQuery: 'passage' },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.metrics.recall_at_k.value).toBe(0);
  });

  it('newNames keeps capitalised words the question did not use', () => {
    const [eventDoc] = docs;
    expect(
      newNames(hidden[0].question, [
        {
          chunk: {
            id: 'e:0',
            docId: eventDoc.id,
            title: eventDoc.title,
            text: eventDoc.text,
          },
          score: 1,
        },
      ]),
    ).toEqual(['Porto', 'March']);
  });
});
