"use client";

import { useEffect, useRef } from "react";
import { ArenaButton } from "@/components/arena/ArenaButton";

export function JoinConfirmDialog({
  open,
  clockMinutes,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  clockMinutes: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (open && !el.open) {
      el.showModal();
    }
    if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="fixed inset-0 z-[80] m-auto max-w-md rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)] p-0 text-[var(--arena-ink)] shadow-xl backdrop:bg-black/50 open:flex open:flex-col"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-bold tracking-tight">Start your {clockMinutes}-minute operation?</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--arena-text-2)]">
          <li>Your personal clock starts immediately and cannot be paused.</li>
          <li>One operation per account — you cannot restart this event.</li>
          <li>All 15 challenges unlock as soon as you join.</li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <ArenaButton variant="ghost" className="w-full sm:w-auto" onClick={onCancel}>
            Not yet
          </ArenaButton>
          <ArenaButton className="w-full sm:w-auto" onClick={onConfirm}>
            Start now
          </ArenaButton>
        </div>
      </div>
    </dialog>
  );
}
