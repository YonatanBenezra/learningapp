import { buildAssessmentResult } from './assessment-result';
import {
  VA1_MAX_SITTING_SCORE,
  VA1_VERIFIED_MIN_SCORE,
  va1BandForTotalScore,
} from './va1-bands';

describe('buildAssessmentResult', () => {
  const base = {
    kind: 'assessment' as const,
    seasonKey: '2026-Q3',
    startsAt: new Date('2026-07-01T00:00:00.000Z'),
    endsAt: new Date('2026-09-30T23:59:59.000Z'),
    timeBoxMinutes: 90,
    sampleSeed: 'seed-abc',
    elapsedMs: 1_800_000,
    skillsByProblem: new Map([
      [
        'asmt-001-chunk-it-right',
        [{ slug: 'chunking', name: 'Chunking' }],
      ],
      [
        'asmt-007-write-the-assertion-suite',
        [{ slug: 'eval-design', name: 'Eval design' }],
      ],
    ]),
  };

  it('returns null for contests', () => {
    expect(
      buildAssessmentResult({
        ...base,
        kind: 'contest',
        problems: [],
      }),
    ).toBeNull();
  });

  it('builds a public-safe result with band and skill rollup', () => {
    const result = buildAssessmentResult({
      ...base,
      problems: [
        {
          slug: 'asmt-001-chunk-it-right',
          title: 'Chunk It Right',
          verdict: 'pass',
          score: 100,
        },
        {
          slug: 'asmt-007-write-the-assertion-suite',
          title: 'Assertion Suite',
          verdict: 'pass',
          score: 100,
        },
        {
          slug: 'asmt-002-the-cost-ceiling',
          title: 'Cost Ceiling',
          verdict: 'pass',
          score: 100,
        },
        {
          slug: 'asmt-008-judge-the-judge',
          title: 'Judge the Judge',
          verdict: 'pass',
          score: 100,
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.totalScore).toBe(VA1_MAX_SITTING_SCORE);
    expect(result!.band).toBe('verified');
    expect(result!.sampleSeed).toBe('seed-abc');
    expect(result!.skills.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result)).not.toContain('eval_hidden');
  });

  it('places a three-pass near-miss sitting below Verified', () => {
    const result = buildAssessmentResult({
      ...base,
      problems: [
        {
          slug: 'asmt-001-chunk-it-right',
          title: 'Chunk It Right',
          verdict: 'pass',
          score: 100,
        },
        {
          slug: 'asmt-007-write-the-assertion-suite',
          title: 'Assertion Suite',
          verdict: 'pass',
          score: 100,
        },
        {
          slug: 'asmt-002-the-cost-ceiling',
          title: 'Cost Ceiling',
          verdict: 'pass',
          score: 100,
        },
        {
          slug: 'asmt-008-judge-the-judge',
          title: 'Judge the Judge',
          verdict: 'fail',
          score: 0,
        },
      ],
    });

    expect(result!.totalScore).toBe(VA1_VERIFIED_MIN_SCORE - 20);
    expect(result!.band).toBe('developing');
    expect(va1BandForTotalScore(result!.totalScore).id).toBe('developing');
  });
});
