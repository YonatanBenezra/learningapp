'use client';

import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import type { ProblemPublic, SubmitResult } from './practiceApi';

interface ProblemViewProps {
  problem: ProblemPublic;
  submitting: boolean;
  onSubmit: (answer: string) => void;
  result: SubmitResult | null;
  onNext: () => void;
  nextBlocked: boolean;
}

export function ProblemView({
  problem,
  submitting,
  onSubmit,
  result,
  onNext,
  nextBlocked,
}: ProblemViewProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const answered = Boolean(result);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{problem.topic}</Badge>
          <Badge variant="outline">{problem.difficulty}</Badge>
        </div>
        <h1 className="text-2xl font-semibold text-ink">{problem.title}</h1>
      </header>

      <p className="text-base leading-relaxed text-ink">{problem.prompt}</p>

      {problem.options && (
        <ul className="space-y-2" role="listbox" aria-label="Answer options">
          {problem.options.map((option) => {
            const isSelected = selected === option;
            const showCorrect = answered && option === result?.correctAnswer;
            const showWrong = answered && isSelected && !result?.correct;
            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={answered || submitting}
                  onClick={() => setSelected(option)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                    'border-line-2 hover:border-primary hover:bg-bg-lav',
                    isSelected && !answered && 'border-primary bg-primary-soft',
                    showCorrect && 'border-good bg-good/10',
                    showWrong && 'border-bad bg-bad/10',
                    answered && 'cursor-default',
                  )}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!answered && (
        <Button
          loading={submitting}
          disabled={!selected}
          onClick={() => selected && onSubmit(selected)}
          className="w-full sm:w-auto"
        >
          Submit answer
        </Button>
      )}

      {result && (
        <div
          className={cn(
            'rounded-2xl border p-4',
            result.correct ? 'border-good/40 bg-good/5' : 'border-bad/40 bg-bad/5',
          )}
        >
          <p className="font-semibold text-ink">
            {result.correct ? 'Correct' : 'Not quite'} · {result.score}%
          </p>
          <p className="mt-2 text-sm text-ink-2">{result.feedback}</p>
          {!result.correct && (
            <p className="mt-2 text-sm text-ink">
              <span className="font-medium">Correct answer:</span> {result.correctAnswer}
            </p>
          )}
          <Button className="mt-4" variant="soft" onClick={onNext}>
            {nextBlocked ? 'Continue (sign in required)' : 'Next problem'}
          </Button>
        </div>
      )}
    </div>
  );
}
