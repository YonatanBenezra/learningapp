'use client';

import { useEffect, useState } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export function EditStructureTitleDialog({
  open,
  kind,
  initialTitle,
  onClose,
  onSave,
  isSaving,
  error,
}: {
  open: boolean;
  kind: 'module' | 'lesson';
  initialTitle: string;
  onClose: () => void;
  onSave: (title: string) => void;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (open) setTitle(initialTitle);
  }, [open, initialTitle]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, isSaving]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={isSaving ? undefined : onClose}
        disabled={isSaving}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-line bg-bg-elev sm:rounded-2xl"
      >
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
                <Pencil className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Edit {kind}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Update title</h2>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={isSaving}
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-ink-3 transition hover:bg-bg-soft hover:text-ink disabled:opacity-50"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <form
          className="px-6 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = title.trim();
            if (!trimmed) return;
            onSave(trimmed);
          }}
        >
          <label htmlFor="structure-title" className="mb-2 block text-sm font-medium text-ink">
            Title
          </label>
          <input
            id="structure-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 w-full rounded-lg border border-line px-4 text-sm outline-none focus:border-primary"
            autoFocus
          />

          {error ? (
            <p className="mt-4 rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="soft" className="rounded-lg" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg bg-primary" disabled={isSaving || !title.trim()}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save title
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStructureTitleDialog;
