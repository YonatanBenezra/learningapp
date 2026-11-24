import { chunkCorpus, type CorpusDoc } from './chunking';
import { tokenize } from './retrieve';

const doc: CorpusDoc = {
  id: 'travel',
  title: 'Travel policy',
  text: [
    'Book flights through the travel desk.',
    'Economy class applies to every flight under six hours, including connections booked on the same ticket.',
    'Hotels are capped at 180 euros a night.',
    'Taxis are reimbursed after 22:00.',
  ].join(' '),
};

const texts = (
  strategy: 'fixed' | 'sentence' | 'recursive',
  size: number,
  overlap = 0,
) => chunkCorpus([doc], size, overlap, strategy).map((chunk) => chunk.text);

describe('chunkCorpus strategies', () => {
  it('fixed windows never cut a word, but do cut sentences', () => {
    const chunks = texts('fixed', 60);
    const words = new Set(`${doc.title}. ${doc.text}`.split(/\s+/));
    for (const chunk of chunks) {
      for (const word of chunk.split(' ')) {
        expect(words.has(word)).toBe(true);
      }
    }
    // Some window ends mid-sentence.
    expect(chunks.some((chunk) => !/[.!?]$/.test(chunk))).toBe(true);
  });

  it('sentence packing keeps every sentence whole, even one longer than the size', () => {
    const chunks = texts('sentence', 60);
    expect(chunks).toContain(
      'Economy class applies to every flight under six hours, including connections booked on the same ticket.',
    );
    for (const chunk of chunks) {
      expect(chunk).toMatch(/[.!?]$/);
    }
  });

  it('recursive splitting keeps the size as a hard limit, unlike sentence packing', () => {
    const recursive = texts('recursive', 60);
    expect(
      Math.max(...recursive.map((chunk) => chunk.length)),
    ).toBeLessThanOrEqual(60);
    expect(recursive).not.toEqual(texts('sentence', 60));
    // Short sentences still stay whole.
    expect(recursive).toContain('Hotels are capped at 180 euros a night.');
  });

  it('overlap carries whole trailing units, never a cut word', () => {
    const plain = texts('sentence', 90);
    const overlapped = texts('sentence', 90, 45);
    expect(overlapped.length).toBeGreaterThanOrEqual(plain.length);
    // "Taxis are reimbursed after 22:00." (33 chars) fits the overlap, so it
    // opens the next chunk only if it ended the previous one; either way every
    // chunk is a run of whole sentences.
    for (const chunk of overlapped) {
      expect(chunk).toMatch(/^[A-Z]/);
      expect(chunk).toMatch(/[.!?]$/);
    }
    const withWordOverlap = texts('fixed', 50, 20);
    for (let i = 1; i < withWordOverlap.length; i += 1) {
      const previous = withWordOverlap[i - 1].split(' ');
      const first = withWordOverlap[i].split(' ')[0];
      expect(previous).toContain(first);
    }
  });

  it('heading-aware splits on markdown headings and prefixes the heading path', () => {
    const handbook: CorpusDoc = {
      id: 'handbook',
      title: 'Handbook',
      text: [
        '# Leave',
        'Staff get 25 days of leave.',
        '## Sick leave',
        'Sick leave needs a note after three days.',
        '# Equipment',
        'Laptops are replaced every four years.',
      ].join('\n'),
    };
    const chunks = chunkCorpus([handbook], 400, 0, 'heading-aware').map(
      (chunk) => chunk.text,
    );
    expect(chunks).toEqual([
      'Handbook › Leave. Staff get 25 days of leave.',
      'Handbook › Leave › Sick leave. Sick leave needs a note after three days.',
      'Handbook › Equipment. Laptops are replaced every four years.',
    ]);
  });

  it('heading-aware without headings repeats the title on every chunk', () => {
    const chunks = chunkCorpus([doc], 80, 0, 'heading-aware');
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.startsWith('Travel policy. ')).toBe(true);
    }
  });

  it('document mode is one chunk per document (locked archetypes only)', () => {
    expect(chunkCorpus([doc], 50, 0, 'document')).toEqual([
      {
        id: 'travel:0',
        docId: 'travel',
        title: 'Travel policy',
        text: `Travel policy. ${doc.text}`,
      },
    ]);
  });
});

describe('tokenize', () => {
  it('keeps Bangla words whole instead of dropping them', () => {
    expect(tokenize('ছুটির নীতি কী? ২২ দিন।')).toEqual([
      'ছুটির',
      'নীতি',
      'কী',
      '২২',
      'দিন',
    ]);
  });

  it('stems English plurals only', () => {
    expect(tokenize('Policies for laptops')).toEqual(['policy', 'laptop']);
  });
});
