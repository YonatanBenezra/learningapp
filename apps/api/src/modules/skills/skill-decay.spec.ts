import {
  decayMultiplier,
  decaySkillScore,
  daysSince,
  SKILL_DECAY_FLOOR_RATIO,
  SKILL_DECAY_HALF_LIFE_DAYS,
  SKILL_DECAY_STALE_AFTER_DAYS,
  toSkillScoreView,
} from './skill-decay';

const NOW = new Date('2026-09-10T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe('skill decay', () => {
  it('leaves a score practised today untouched', () => {
    expect(decaySkillScore({ score: 1, lastPracticedAt: NOW }, NOW)).toEqual({
      score: 1,
      rawScore: 1,
      daysSincePractice: 0,
      stale: false,
    });
  });

  it('halves the score after one half-life', () => {
    const result = decaySkillScore(
      { score: 1, lastPracticedAt: daysAgo(SKILL_DECAY_HALF_LIFE_DAYS) },
      NOW,
    );
    expect(result.score).toBeCloseTo(0.5, 4);
    expect(result.rawScore).toBe(1);
    expect(result.daysSincePractice).toBe(SKILL_DECAY_HALF_LIFE_DAYS);
  });

  it('clamps at the floor instead of reaching zero', () => {
    const result = decaySkillScore(
      { score: 1, lastPracticedAt: daysAgo(3650) },
      NOW,
    );
    expect(result.score).toBe(SKILL_DECAY_FLOOR_RATIO);
    expect(decayMultiplier(100000)).toBe(SKILL_DECAY_FLOOR_RATIO);
  });

  it('scales the floor by the stored score', () => {
    const result = decaySkillScore(
      { score: 0.8, lastPracticedAt: daysAgo(3650) },
      NOW,
    );
    expect(result.score).toBeCloseTo(0.8 * SKILL_DECAY_FLOOR_RATIO, 4);
  });

  it('never decays a row with no practice date', () => {
    expect(decaySkillScore({ score: 0.8, lastPracticedAt: null }, NOW)).toEqual(
      {
        score: 0.8,
        rawScore: 0.8,
        daysSincePractice: null,
        stale: false,
      },
    );
    expect(daysSince(null, NOW)).toBeNull();
  });

  it('ignores a future practice date rather than inflating the score', () => {
    const result = decaySkillScore(
      { score: 1, lastPracticedAt: new Date(NOW.getTime() + 86400000) },
      NOW,
    );
    expect(result.score).toBe(1);
    expect(result.daysSincePractice).toBe(0);
  });

  it('keeps a zero score at zero', () => {
    expect(
      decaySkillScore({ score: 0, lastPracticedAt: daysAgo(400) }, NOW).score,
    ).toBe(0);
  });

  it('decays monotonically with time', () => {
    const scores = [0, 30, 90, 180, 365].map(
      (days) =>
        decaySkillScore({ score: 1, lastPracticedAt: daysAgo(days) }, NOW)
          .score,
    );
    for (let index = 1; index < scores.length; index += 1) {
      expect(scores[index]).toBeLessThan(scores[index - 1]);
    }
  });

  it('marks a row stale only once the surface should explain the gap', () => {
    const fresh = decaySkillScore(
      { score: 1, lastPracticedAt: daysAgo(SKILL_DECAY_STALE_AFTER_DAYS - 1) },
      NOW,
    );
    const stale = decaySkillScore(
      { score: 1, lastPracticedAt: daysAgo(SKILL_DECAY_STALE_AFTER_DAYS) },
      NOW,
    );
    expect(fresh.stale).toBe(false);
    expect(stale.stale).toBe(true);
  });

  it('restores the score when the skill is practised again', () => {
    const stale = decaySkillScore(
      { score: 1, lastPracticedAt: daysAgo(400) },
      NOW,
    );
    const practised = decaySkillScore({ score: 1, lastPracticedAt: NOW }, NOW);
    expect(stale.score).toBeLessThan(practised.score);
    expect(practised.score).toBe(stale.rawScore);
  });

  it('builds a radar row with both scores', () => {
    expect(
      toSkillScoreView(
        {
          score: 1,
          lastPracticedAt: daysAgo(SKILL_DECAY_HALF_LIFE_DAYS),
          skill: { slug: 'chunking', name: 'Chunking' },
        },
        NOW,
      ),
    ).toEqual({
      slug: 'chunking',
      name: 'Chunking',
      score: 0.5,
      rawScore: 1,
      daysSincePractice: 180,
      stale: true,
    });
  });
});
