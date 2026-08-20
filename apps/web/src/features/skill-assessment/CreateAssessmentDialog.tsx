'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateAssessmentFlow } from '@/src/features/skill-assessment/CreateAssessmentFlow';

export function CreateAssessmentDialog({
  open,
  onClose,
  quota,
}: {
  open: boolean;
  onClose: () => void;
  quota?: import('@/src/domain/assessment').SkillAssessmentQuota;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden sm:max-h-[90vh]"
      >
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-md border border-line/80 bg-bg-elev text-ink/45 transition hover:text-ink sm:right-6 sm:top-6"
        >
          <X className="size-5" />
        </button>
        <div className="overflow-y-auto">
          <CreateAssessmentFlow quota={quota} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}

export default CreateAssessmentDialog;
