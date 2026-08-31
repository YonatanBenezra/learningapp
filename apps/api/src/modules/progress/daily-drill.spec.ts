import { addCalendarDays } from './calendar';
import {
  drillPool,
  pickDailyDrill,
  type DrillCandidate,
} from './daily-drill';

const easyA: DrillCandidate = {
  slug: 'rag-001-chunk-it-right',
  title: 'Chunk It Right',
  difficulty: 'E',
  simulator: 'rag',
  type: 'exercise',
};
const easyB: DrillCandidate = {
  slug: 'pe-001-the-json-contract',
  title: 'The JSON Contract',
  difficulty: 'E',
  simulator: 'prompt_engineering',
  type: 'exercise',
};
const hard: DrillCandidate = {
  slug: 'eval-002-judge-the-judge',
  title: 'Judge the Judge',
  difficulty: 'H',
  simulator: 'evaluation',
  type: 'exercise',
};
const taggedDrill: DrillCandidate = {
  slug: 'rag-005-sentence-split',
  title: 'Sentence Split',
  difficulty: 'E',
  simulator: 'rag',
  type: 'drill',
};

describe('daily drill', () => {
  it('prefers type=drill, then Easy, then the full catalogue', () => {
    expect(drillPool([easyA, hard, taggedDrill]).map((row) => row.slug)).toEqual(
      [taggedDrill.slug],
    );
    expect(drillPool([easyA, easyB, hard]).map((row) => row.slug)).toEqual([
      easyB.slug,
      easyA.slug,
    ]);
    expect(drillPool([hard]).map((row) => row.slug)).toEqual([hard.slug]);
  });

  it('surfaces the same exercise for a calendar day and rotates the next day', () => {
    const pool = drillPool([easyA, easyB, hard]);
    const day = '2026-09-01';
    const first = pickDailyDrill(pool, day);
    const again = pickDailyDrill(pool, day);
    const next = pickDailyDrill(pool, addCalendarDays(day, 1));
    expect(first).not.toBeNull();
    expect(again?.slug).toBe(first?.slug);
    expect(next?.slug).not.toBe(first?.slug);
  });

  it('returns null when the catalogue is empty', () => {
    expect(pickDailyDrill([], '2026-09-01')).toBeNull();
  });
});
