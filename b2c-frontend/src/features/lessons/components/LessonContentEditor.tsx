'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import type { LessonContent } from '@/src/features/lessons/lessonsApi';

export interface LessonContentDraft {
  title: string;
  summary: string;
  sections: Array<{ title: string; body: string }>;
  keyPoints: string[];
}

function toDraft(title: string, content: LessonContent | null | undefined): LessonContentDraft {
  const sections =
    content?.sections && content.sections.length > 0
      ? content.sections.map((section) => ({
          title: section.title ?? '',
          body: section.body ?? '',
        }))
      : [{ title: 'Introduction', body: '' }];

  return {
    title,
    summary: content?.summary ?? '',
    sections,
    keyPoints: content?.keyPoints ?? [],
  };
}

export function LessonContentEditor({
  title,
  content,
  isSaving,
  error,
  onCancel,
  onSave,
}: {
  title: string;
  content: LessonContent | null | undefined;
  isSaving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (draft: LessonContentDraft) => void;
}) {
  const [draft, setDraft] = useState(() => toDraft(title, content));

  useEffect(() => {
    setDraft(toDraft(title, content));
  }, [title, content]);

  function updateSection(index: number, patch: Partial<{ title: string; body: string }>) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="lesson-title" className="mb-2 block text-sm font-medium text-ink">
          Lesson title
        </label>
        <input
          id="lesson-title"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          className="h-11 w-full rounded-lg border border-line px-4 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="lesson-summary" className="mb-2 block text-sm font-medium text-ink">
          Overview
        </label>
        <textarea
          id="lesson-summary"
          value={draft.summary}
          onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
          rows={4}
          className="w-full rounded-lg border border-line px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary"
          placeholder="Short summary of what this lesson covers…"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-3">Sections</h3>
          <Button
            type="button"
            variant="soft"
            size="sm"
            className="rounded-lg"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                sections: [...current.sections, { title: 'New section', body: '' }],
              }))
            }
          >
            <Plus className="size-4" />
            Add section
          </Button>
        </div>

        {draft.sections.map((section, index) => (
          <div key={index} className="rounded-lg border border-line bg-bg-soft/50 p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Section {index + 1}
              </p>
              {draft.sections.length > 1 ? (
                <button
                  type="button"
                  aria-label="Delete section"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      sections: current.sections.filter((_, i) => i !== index),
                    }))
                  }
                  className="grid size-8 place-items-center rounded-md border border-line text-ink-3 transition hover:border-bad hover:text-bad"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
            <input
              value={section.title}
              onChange={(event) => updateSection(index, { title: event.target.value })}
              placeholder="Section title"
              className="mb-3 h-10 w-full rounded-lg border border-line px-3 text-sm font-medium outline-none focus:border-primary"
            />
            <textarea
              value={section.body}
              onChange={(event) => updateSection(index, { body: event.target.value })}
              rows={6}
              placeholder="Write the lesson content for this section…"
              className="w-full rounded-lg border border-line px-3 py-3 text-sm leading-relaxed outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-3">Key takeaways</h3>
          <Button
            type="button"
            variant="soft"
            size="sm"
            className="rounded-lg"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                keyPoints: [...current.keyPoints, ''],
              }))
            }
          >
            <Plus className="size-4" />
            Add point
          </Button>
        </div>

        {draft.keyPoints.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-3">
            No key points yet. Add one to highlight important ideas.
          </p>
        ) : (
          draft.keyPoints.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={point}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    keyPoints: current.keyPoints.map((item, i) =>
                      i === index ? event.target.value : item,
                    ),
                  }))
                }
                placeholder="Key takeaway"
                className="h-10 flex-1 rounded-lg border border-line px-3 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                aria-label="Delete key point"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    keyPoints: current.keyPoints.filter((_, i) => i !== index),
                  }))
                }
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-ink-3 transition hover:border-bad hover:text-bad"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">{error}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
        <Button type="button" variant="soft" className="rounded-lg" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-lg bg-primary"
          disabled={isSaving || !draft.title.trim()}
          onClick={() => onSave(draft)}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save content
        </Button>
      </div>
    </div>
  );
}

export default LessonContentEditor;
