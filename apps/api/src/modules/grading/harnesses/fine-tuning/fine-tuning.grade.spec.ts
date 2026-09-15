import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  F1_NEAR_MISS_PAYLOAD,
  F1_REFERENCE_PAYLOAD,
  F2_NEAR_MISS_PAYLOAD,
  F2_REFERENCE_PAYLOAD,
  F4_NEAR_MISS_PAYLOAD,
  F4_REFERENCE_PAYLOAD,
  F5_NEAR_MISS_PAYLOAD,
  F5_REFERENCE_PAYLOAD,
  FINE_TUNING_SLUGS,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeF1 } from './f1.grade';
import { gradeF2 } from './f2.grade';
import { gradeF3 } from './f3.grade';
import { gradeF4 } from './f4.grade';
import { gradeF5 } from './f5.grade';

const contentRoot = path.join(process.cwd(), 'content/exercises');

function loadHidden(slug: string): unknown {
  return JSON.parse(
    readFileSync(path.join(contentRoot, slug, 'eval_hidden.json'), 'utf8'),
  );
}

describe('fine-tuning graders', () => {
  it('F1 reference passes with cost scorecard', () => {
    const hidden = loadHidden('ft-001-tune-or-prompt');
    const pass = gradeF1(F1_REFERENCE_PAYLOAD, hidden, []);
    expect(pass.verdict).toBe('pass');
    expect(pass.scorecard.promptTotalEur).toBe(260);
    expect(pass.scorecard.fineTuneTotalEur).toBe(824);
    const fail = gradeF1(F1_NEAR_MISS_PAYLOAD, hidden, []);
    expect(fail.verdict).toBe('fail');
  });

  it('F2 reference passes on leakage rows', () => {
    const hidden = loadHidden('ft-002-prep-the-dataset');
    expect(gradeF2(F2_REFERENCE_PAYLOAD, hidden, []).verdict).toBe('pass');
    expect(gradeF2(F2_NEAR_MISS_PAYLOAD, hidden, []).verdict).toBe('fail');
  });

  it('F3 reuses benchmark variance grading', () => {
    const hidden = loadHidden('ft-003-judge-the-tuned-model');
    const pass = gradeF3(
      { rankingCall: 'noise', deltaCause: 'ci_overlap' },
      hidden,
      [],
    );
    expect(pass.verdict).toBe('pass');
    expect(pass.trace.simulator).toBe('fine_tuning');
    const fail = gradeF3(
      { rankingCall: 'b_wins', deltaCause: 'better_model' },
      hidden,
      [],
    );
    expect(fail.verdict).toBe('fail');
  });

  it('F4 reference passes on LoRA + data scarcity', () => {
    const hidden = loadHidden('ft-004-pick-the-adapter');
    expect(gradeF4(F4_REFERENCE_PAYLOAD, hidden, []).verdict).toBe('pass');
    expect(gradeF4(F4_NEAR_MISS_PAYLOAD, hidden, []).verdict).toBe('fail');
  });

  it('F5 reference passes on duplicate rows', () => {
    const hidden = loadHidden('ft-005-spot-the-duplicates');
    expect(gradeF5(F5_REFERENCE_PAYLOAD, hidden, []).verdict).toBe('pass');
    expect(gradeF5(F5_NEAR_MISS_PAYLOAD, hidden, []).verdict).toBe('fail');
  });

  it.each(FINE_TUNING_SLUGS)('content hidden exists for %s', (slug) => {
    expect(loadHidden(slug)).toBeTruthy();
  });
});
