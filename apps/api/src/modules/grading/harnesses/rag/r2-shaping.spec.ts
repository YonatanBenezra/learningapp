import type { Chunk } from './chunking';
import { compress, scoreCutoff, withNeighbors } from './r2.grade';
import type { RankedChunk } from './retrieve';

function chunk(docId: string, index: number, text: string): Chunk {
  return { id: `${docId}:${index}`, docId, title: docId, text };
}

const page = [
  chunk('desk', 0, 'Guests leave a deposit at check-in.'),
  chunk('desk', 1, 'It is released after check-out.'),
  chunk('desk', 2, 'Breakfast starts at seven.'),
  chunk('desk', 3, 'It ends at ten.'),
];

describe('R2 context shaping', () => {
  it('keeps only chunks scoring at least the ratio of the best one', () => {
    const ranked: RankedChunk[] = [
      { chunk: page[0], score: 10 },
      { chunk: page[2], score: 8 },
      { chunk: page[3], score: 3 },
    ];
    expect(scoreCutoff(ranked, 0.7).map((row) => row.chunk.id)).toEqual([
      'desk:0',
      'desk:2',
    ]);
    expect(scoreCutoff(ranked, 0)).toEqual(ranked);
  });

  it('sends each hit with its neighbours and merges windows that touch', () => {
    const shaped = withNeighbors(
      page,
      [
        { chunk: page[0], score: 5 },
        { chunk: page[2], score: 4 },
      ],
      1,
    );
    expect(shaped).toHaveLength(1);
    expect(shaped[0].chunk.id).toBe('desk:0-3');
    expect(shaped[0].chunk.text).toBe(page.map((part) => part.text).join(' '));
    expect(withNeighbors(page, [{ chunk: page[1], score: 1 }], 0)).toEqual([
      { chunk: page[1], score: 1 },
    ]);
  });

  it('compresses a chunk to the sentences that share the most question words', () => {
    const whole: RankedChunk = {
      chunk: chunk(
        'parcel',
        0,
        'A large parcel costs 18 euros. The weight limit for a large parcel is 20 kg. Delivery takes 2 days.',
      ),
      score: 1,
    };
    const [kept] = compress(
      'What is the weight limit for a large parcel?',
      [whole],
      1,
    );
    expect(kept.chunk.text).toBe(
      'The weight limit for a large parcel is 20 kg.',
    );
    expect(compress('anything', [whole], 0)).toEqual([whole]);
  });
});
