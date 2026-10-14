import {
  emptyTrackCounts,
  simulatorToTrack,
  streakDaysFromPassDates,
  strongestTracksFromCounts,
} from './leaderboard-tracks';

describe('leaderboard tracks', () => {
  it('maps simulators to catalog tracks', () => {
    expect(simulatorToTrack('rag')).toBe('rag');
    expect(simulatorToTrack('evaluation')).toBe('eval');
    expect(simulatorToTrack('guardrails')).toBe('guard');
    expect(simulatorToTrack('prompt_engineering')).toBe('prompt');
    expect(simulatorToTrack('agent')).toBeNull();
  });

  it('picks strongest tracks by unique pass count', () => {
    const counts = { ...emptyTrackCounts(), rag: 5, eval: 2, guard: 3 };
    expect(strongestTracksFromCounts(counts)).toEqual(['rag', 'guard']);
  });

  it('computes streak ending on latest pass day', () => {
    const dates = [
      new Date('2026-10-10T12:00:00.000Z'),
      new Date('2026-10-11T08:00:00.000Z'),
      new Date('2026-10-12T20:00:00.000Z'),
    ];
    expect(streakDaysFromPassDates(dates)).toBe(3);
    expect(streakDaysFromPassDates([dates[0], dates[2]])).toBe(1);
  });
});
