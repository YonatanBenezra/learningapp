import {
  assessmentSeasonKey,
  currentAssessmentSeasonKey,
} from './assessment-season';

describe('assessmentSeasonKey', () => {
  it('maps UTC months to quarterly keys', () => {
    expect(assessmentSeasonKey(new Date('2026-01-15T12:00:00.000Z'))).toBe(
      '2026-Q1',
    );
    expect(assessmentSeasonKey(new Date('2026-04-01T00:00:00.000Z'))).toBe(
      '2026-Q2',
    );
    expect(assessmentSeasonKey(new Date('2026-09-14T00:00:00.000Z'))).toBe(
      '2026-Q3',
    );
    expect(assessmentSeasonKey(new Date('2026-11-30T23:59:59.000Z'))).toBe(
      '2026-Q4',
    );
  });

  it('currentAssessmentSeasonKey uses now', () => {
    expect(currentAssessmentSeasonKey(new Date('2026-09-14T00:00:00.000Z'))).toBe(
      '2026-Q3',
    );
  });
});
