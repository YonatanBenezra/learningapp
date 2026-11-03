"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { SettingsButton } from "@/features/account-settings/components/settings-button";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  danger?: boolean;
};

export function ConfirmModal({
  open,
  title,
  onClose,
  children,
  confirmLabel = "Confirm",
  onConfirm,
  confirmDisabled,
  confirmLoading,
  danger,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md rounded-lg border border-[#2A3547] bg-[#151F2E] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="confirm-modal-title" className="text-lg font-semibold text-[#F4F4F4]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] p-1 text-[#8799B5] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="text-sm text-[#8799B5]">{children}</div>
        {onConfirm ? (
          <div className="mt-6 flex justify-end gap-3">
            <SettingsButton variant="ghost" onClick={onClose}>
              Cancel
            </SettingsButton>
            <SettingsButton
              variant={danger ? "danger-ghost" : "secondary"}
              onClick={onConfirm}
              disabled={confirmDisabled}
              loading={confirmLoading}
              className={danger ? "border border-[#F35E5E40]" : undefined}
            >
              {confirmLabel}
            </SettingsButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
