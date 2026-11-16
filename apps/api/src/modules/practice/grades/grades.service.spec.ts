import { redactFailingCases } from './grades.service';

describe('redactFailingCases', () => {
  it('drops gold labels but keeps learner-facing feedback', () => {
    const redacted = redactFailingCases([
      {
        question: 'How many PTO days?',
        goldSpan: 'twenty-two (22) days of paid time off',
        goldAnswer: '22',
        retrieved: ['PTO. Staff receive leave…'],
        note: 'gold span not in top-k',
      },
    ]);

    expect(redacted).toEqual([
      {
        question: 'How many PTO days?',
        retrieved: ['PTO. Staff receive leave…'],
        note: 'gold span not in top-k',
      },
    ]);
  });

  it('passes through non-array and non-object values', () => {
    expect(redactFailingCases(null)).toBeNull();
    expect(redactFailingCases(['plain'])).toEqual(['plain']);
  });
});
