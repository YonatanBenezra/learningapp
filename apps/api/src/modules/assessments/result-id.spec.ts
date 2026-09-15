import { isResultId } from './result-id';

describe('isResultId', () => {
  it('accepts canonical uuids', () => {
    expect(isResultId('11111111-1111-4111-8111-111111111111')).toBe(true);
  });

  it('rejects malformed ids without touching the database', () => {
    expect(isResultId('not-a-uuid')).toBe(false);
    expect(isResultId('')).toBe(false);
  });
});
