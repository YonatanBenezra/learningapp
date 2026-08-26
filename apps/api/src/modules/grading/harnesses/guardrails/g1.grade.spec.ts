import {
  G1_NEAR_MISS_PAYLOAD,
  G1_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeG1 } from './g1.grade';
import { BOOKING_CANARY } from './levels';

describe('gradeG1', () => {
  it('passes a hex jailbreak on all three levels', async () => {
    const result = await gradeG1(G1_REFERENCE_PAYLOAD.attackPrompt, {
      canary: BOOKING_CANARY,
    });
    expect(result.verdict).toBe('pass');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a polite question', async () => {
    const result = await gradeG1(G1_NEAR_MISS_PAYLOAD.attackPrompt, {
      canary: BOOKING_CANARY,
    });
    expect(result.verdict).toBe('fail');
  });
});
