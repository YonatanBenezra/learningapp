'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ListChecks,
  PenLine,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { difficultyClass, problemTypeLabel } from '@/src/features/platform/problemLabels';
import type { ProblemPublic, SubmitResult } from './practiceApi';

type AnswerMode = 'choice' | 'written';

interface ProblemViewProps {
  problem: ProblemPublic;
  submitting: boolean;
  onSubmit: (answer: string) => void;
  result: SubmitResult | null;
  onNext: () => void;
  nextBlocked: boolean;
}

function defaultMode(problem: ProblemPublic): AnswerMode {
  if (problem.type === 'short_answer' || problem.type === 'prompt_design' || problem.type === 'code') {
    return 'written';
  }
  if (problem.options?.length) return 'choice';
  return 'written';
}

function writtenPlaceholder(problem: ProblemPublic): string {
  if (problem.type === 'prompt_design') {
    return 'Write your prompt here — be specific about format, keys, and constraints…';
  }
  if (problem.type === 'code') {
    return 'Write your code or pseudocode answer here…';
  }
  return 'Type your answer in your own words…';
}

export function ProblemView({
  problem,
  submitting,
  onSubmit,
  result,
  onNext,
  nextBlocked,
}: ProblemViewProps) {
  const hasChoices = Boolean(problem.options?.length);
  const [mode, setMode] = useState<AnswerMode>(() => defaultMode(problem));
  const [selected, setSelected] = useState<string | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');

  useEffect(() => {
    setMode(defaultMode(problem));
    setSelected(null);
    setWrittenAnswer('');
  }, [problem.slug]);

  const answered = Boolean(result);
  const canSubmit =
    mode === 'choice' ? Boolean(selected?.trim()) : Boolean(writtenAnswer.trim());

  const optionLabels = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F'], []);

  function handleSubmit() {
    if (mode === 'choice' && selected) {
      onSubmit(selected);
      return;
    }
    if (mode === 'written' && writtenAnswer.trim()) {
      onSubmit(writtenAnswer.trim());
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {problem.topic}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-line/80 px-3 py-1 text-xs font-medium capitalize dark:border-line-2',
            difficultyClass(problem.difficulty),
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {problem.difficulty}
        </span>
        <span className="inline-flex items-center rounded-full border border-line/80 px-3 py-1 text-xs font-medium text-ink-2 dark:border-line-2">
          {problemTypeLabel(problem.type)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
        <section className="overflow-hidden rounded-2xl border border-line/80 bg-bg-elev shadow-card dark:border-line-2">
          <div className="border-b border-line/70 px-5 py-4 dark:border-line-2 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              <Sparkles className="size-3.5 text-primary" />
              Problem
            </div>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
              {problem.title}
            </h1>
          </div>
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-base leading-7 text-ink sm:text-[1.05rem]">{problem.prompt}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-line/80 bg-bg-elev shadow-card dark:border-line-2 lg:sticky lg:top-20">
          <div className="border-b border-line/70 px-4 py-3 dark:border-line-2 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Your answer</p>
            {hasChoices ? (
              <div className="mt-3 flex gap-1 rounded-xl bg-bg-soft p-1 dark:bg-bg-soft/80">
                <button
                  type="button"
                  onClick={() => setMode('choice')}
                  disabled={answered || submitting}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                    mode === 'choice'
                      ? 'bg-bg-elev text-ink shadow-sm dark:bg-bg'
                      : 'text-ink-2 hover:text-ink',
                  )}
                >
                  <ListChecks className="size-4" />
                  Multiple choice
                </button>
                <button
                  type="button"
                  onClick={() => setMode('written')}
                  disabled={answered || submitting}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                    mode === 'written'
                      ? 'bg-bg-elev text-ink shadow-sm dark:bg-bg'
                      : 'text-ink-2 hover:text-ink',
                  )}
                >
                  <PenLine className="size-4" />
                  Write answer
                </button>
              </div>
            ) : null}
          </div>

          <div className="px-4 py-4 sm:px-5 sm:py-5">
            {mode === 'choice' && hasChoices ? (
              <ul className="space-y-2.5" role="listbox" aria-label="Answer options">
                {problem.options!.map((option, index) => {
                  const label = optionLabels[index] ?? String(index + 1);
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
                          'group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                          'border-line/80 hover:border-primary/40 hover:bg-primary-soft/20 dark:border-line-2',
                          isSelected && !answered && 'border-primary bg-primary-soft/30 shadow-sm',
                          showCorrect && 'border-good bg-good/10',
                          showWrong && 'border-bad bg-bad/10',
                          answered && 'cursor-default',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border text-xs font-semibold',
                            isSelected && !answered
                              ? 'border-primary bg-primary text-primary-ink'
                              : 'border-line/80 bg-bg-soft text-ink-2 dark:border-line-2',
                            showCorrect && 'border-good bg-good text-white',
                            showWrong && 'border-bad bg-bad text-white',
                          )}
                        >
                          {showCorrect ? <CheckCircle2 className="size-4" /> : showWrong ? <XCircle className="size-4" /> : label}
                        </span>
                        <span className="min-w-0 flex-1 pt-0.5 text-sm leading-6 text-ink">{option}</span>
                        {!answered ? (
                          <Circle
                            className={cn(
                              'mt-1 size-4 shrink-0',
                              isSelected ? 'fill-primary text-primary' : 'text-line dark:text-line-2',
                            )}
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="space-y-2">
                <label htmlFor="problem-written-answer" className="text-sm font-medium text-ink">
                  {problem.type === 'prompt_design' ? 'Your prompt' : 'Your response'}
                </label>
                <textarea
                  id="problem-written-answer"
                  value={writtenAnswer}
                  onChange={(event) => setWrittenAnswer(event.target.value)}
                  disabled={answered || submitting}
                  rows={8}
                  spellCheck={problem.type !== 'code'}
                  placeholder={writtenPlaceholder(problem)}
                  className={cn(
                    'w-full resize-y rounded-xl border border-line/80 bg-bg px-4 py-3 text-sm leading-6 text-ink outline-none transition-colors',
                    'placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/20',
                    'dark:border-line-2 dark:bg-bg-soft/40',
                    problem.type === 'code' || problem.type === 'prompt_design' ? 'font-mono' : '',
                  )}
                />
                <p className="text-xs text-ink-3">
                  {hasChoices
                    ? 'Explain in your own words, or switch to multiple choice above.'
                    : 'We grade written answers against the reference solution.'}
                </p>
              </div>
            )}

            {!answered ? (
              <Button
                loading={submitting}
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="mt-5 h-11 w-full rounded-xl px-5 text-sm font-semibold shadow-none"
              >
                Submit answer
              </Button>
            ) : null}

            {result ? (
              <div
                className={cn(
                  'mt-5 rounded-xl border p-4',
                  result.correct ? 'border-good/40 bg-good/5' : 'border-bad/40 bg-bad/5',
                )}
              >
                <div className="flex items-start gap-3">
                  {result.correct ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-good" />
                  ) : (
                    <XCircle className="mt-0.5 size-5 shrink-0 text-bad" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {result.correct ? 'Correct' : 'Not quite'} · {result.score}%
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-2">{result.feedback}</p>
                    {!result.correct ? (
                      <p className="mt-3 rounded-lg bg-bg-soft/80 px-3 py-2 text-sm leading-6 text-ink dark:bg-bg-soft/40">
                        <span className="font-medium">Reference answer:</span> {result.correctAnswer}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button className="mt-4 h-10 w-full rounded-xl" variant="soft" onClick={onNext}>
                  {nextBlocked ? 'Continue (sign in required)' : 'Next problem'}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
