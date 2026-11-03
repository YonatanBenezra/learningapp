"use client";

import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { AddItemKind } from "@/features/profile/platform/types";
import { CountrySelect } from "@/components/ui/country-select";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalShell({ title, open, onClose, children }: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close dialog" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-platform-border bg-platform-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="modal-title" className="text-base font-semibold text-platform-text">
            {title}
          </h2>
          <button
            type="button"
            className="rounded p-1 text-platform-muted transition-colors hover:bg-platform-input hover:text-platform-text"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const ADD_LABELS: Record<AddItemKind, { title: string; placeholder: string; multi?: boolean }> = {
  summary: { title: "Add summary", placeholder: "Tell the world about yourself…" },
  socials: { title: "Add social", placeholder: "https://github.com/you" },
  interests: { title: "Add interest", placeholder: "RAG, evals, …", multi: true },
  skills: { title: "Add skill", placeholder: "Retrieval, chunking, …", multi: true },
  tools: { title: "Add tool", placeholder: "LangChain, …", multi: true },
  languages: { title: "Add language", placeholder: "English", multi: true },
  certifications: { title: "Add certification", placeholder: "Certificate name" },
  achievements: { title: "Add achievement", placeholder: "Achievement name" },
  events: { title: "Add event", placeholder: "Event name" },
};

type AddItemModalProps = {
  kind: AddItemKind | null;
  open: boolean;
  onClose: () => void;
  onSave: (kind: AddItemKind, value: string) => void;
};

export function AddItemModal({ kind, open, onClose, onSave }: AddItemModalProps) {
  const [value, setValue] = useState("");
  const meta = kind ? ADD_LABELS[kind] : null;

  useEffect(() => {
    if (open) setValue("");
  }, [open, kind]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!kind || !value.trim()) return;
    onSave(kind, value.trim());
    onClose();
  }

  return (
    <ModalShell title={meta?.title ?? "Add item"} open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-platform-muted">
          {meta?.multi ? "Comma-separated values" : "Value"}
          <textarea
            className="min-h-[100px] rounded border border-platform-border bg-platform-page px-3 py-2 text-sm text-platform-text outline-none focus:border-platform-accent"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={meta?.placeholder}
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded bg-platform-accent text-sm font-bold text-platform-accent-on transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </form>
    </ModalShell>
  );
}

type EditProfileModalProps = {
  open: boolean;
  onClose: () => void;
  initial: { name: string; username: string; country: string };
  onSave: (data: { name: string; username: string; country: string }) => void;
  pending?: boolean;
};

export function EditProfileModal({
  open,
  onClose,
  initial,
  onSave,
  pending,
}: EditProfileModalProps) {
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username);
  const [country, setCountry] = useState(initial.country);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setUsername(initial.username);
      setCountry(initial.country);
    }
  }, [open, initial]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ name: name.trim(), username: username.trim(), country: country.trim() });
  }

  const field =
    "h-10 w-full rounded border border-platform-border bg-platform-page px-3 text-sm text-platform-text outline-none focus:border-platform-accent";

  return (
    <ModalShell title="Edit profile" open={open} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-platform-muted">
          Full name
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-platform-muted">
          Username
          <input
            className={cn(field, "font-[family-name:var(--font-roboto-mono)]")}
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
            maxLength={32}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-platform-muted">
          Country
          <CountrySelect value={country} onChange={setCountry} disabled={pending} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded bg-platform-accent text-sm font-bold text-platform-accent-on disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </ModalShell>
  );
}
