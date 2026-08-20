'use client';

import { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { Button } from '@/src/components/ui/button';

export function DeleteStructureItemDialog({
  open,
  kind,
  title,
  onClose,
  onConfirm,
  isDeleting,
  error,
}: {
  open: boolean;
  kind: 'module' | 'lesson';
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  error?: string | null;
}) {
  const { t } = useTranslation();
  const kindLabel = kind === 'module' ? t('instructor.kindModule') : t('instructor.kindLesson');

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, isDeleting]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t('common.cancel')}
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={isDeleting ? undefined : onClose}
        disabled={isDeleting}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-line bg-bg-elev sm:rounded-2xl"
      >
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-bad/20 bg-bad-soft text-bad">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bad">
                  {t('instructor.deleteKind', { kind: kindLabel })}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">{t('instructor.deleteCourseConfirm')}</h2>
              </div>
            </div>
            <button
              type="button"
              aria-label={t('common.cancel')}
              onClick={onClose}
              disabled={isDeleting}
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-ink-3 transition hover:bg-bg-soft hover:text-ink disabled:opacity-50"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-ink-2">
            {t('instructor.deleteKindWarning', { kind: kindLabel })}{' '}
            <strong className="font-semibold text-ink">{title}</strong>.
            {kind === 'module' ? ` ${t('instructor.deleteModuleNote')}` : null}
          </p>

          {error ? (
            <p className="mt-4 rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end">
          <Button variant="soft" className="rounded-lg" onClick={onClose} disabled={isDeleting}>
            {t('instructor.cancel')}
          </Button>
          <Button variant="danger" className="rounded-lg" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {t('instructor.deleteKind', { kind: kindLabel })}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteStructureItemDialog;
