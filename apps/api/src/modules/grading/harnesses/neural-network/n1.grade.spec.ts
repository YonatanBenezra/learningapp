import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  N1_NEAR_MISS_PAYLOAD,
  N1_REFERENCE_PAYLOAD,
  NEURAL_NETWORK_SLUGS,
  N2_NEAR_MISS_PAYLOAD,
  N2_REFERENCE_PAYLOAD,
  N3_NEAR_MISS_PAYLOAD,
  N3_REFERENCE_PAYLOAD,
  N4_NEAR_MISS_PAYLOAD,
  N4_REFERENCE_PAYLOAD,
  N5_NEAR_MISS_PAYLOAD,
  N5_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeNeuralNetwork } from './neural-network.grade';
import type { NeuralNetworkHidden } from './neural-network.types';

function loadHidden(slug: string): NeuralNetworkHidden {
  return JSON.parse(
    readFileSync(
      path.join(process.cwd(), 'content/exercises', slug, 'eval_hidden.json'),
      'utf8',
    ),
  ) as NeuralNetworkHidden;
}

describe('gradeNeuralNetwork', () => {
  it.each([
    [NEURAL_NETWORK_SLUGS[0], N1_REFERENCE_PAYLOAD, N1_NEAR_MISS_PAYLOAD],
    [NEURAL_NETWORK_SLUGS[1], N2_REFERENCE_PAYLOAD, N2_NEAR_MISS_PAYLOAD],
    [NEURAL_NETWORK_SLUGS[2], N3_REFERENCE_PAYLOAD, N3_NEAR_MISS_PAYLOAD],
    [NEURAL_NETWORK_SLUGS[3], N4_REFERENCE_PAYLOAD, N4_NEAR_MISS_PAYLOAD],
    [NEURAL_NETWORK_SLUGS[4], N5_REFERENCE_PAYLOAD, N5_NEAR_MISS_PAYLOAD],
  ])('grades %s reference pass and near-miss fail', (slug, reference, nearMiss) => {
    const hidden = loadHidden(slug);
    const pass = gradeNeuralNetwork(reference, hidden, []);
    expect(pass.verdict).toBe('pass');
    expect(JSON.stringify(pass)).not.toContain('HIDDEN_EVAL');

    const fail = gradeNeuralNetwork(nearMiss, hidden, []);
    expect(fail.verdict).toBe('fail');
    expect(JSON.stringify(fail)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a canary echo without putting the canary in the scorecard', () => {
    const hidden = loadHidden(NEURAL_NETWORK_SLUGS[0]);
    const result = gradeNeuralNetwork(
      { ...N1_REFERENCE_PAYLOAD, note: 'HIDDEN_EVAL_N1_CANARY_PHRASE' },
      hidden,
      [],
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('canary-leak');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
