"use client";

import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { SettingsButton } from "@/features/account-settings/components/settings-button";
function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "LP";
}

type AvatarUploaderProps = {
  fullName: string;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
};

export function AvatarUploader({ fullName, avatarUrl, onAvatarChange }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);

  const initials = initialsFromName(fullName);

  function onFile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onAvatarChange(url);
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        <div
          className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1E2939] text-xl font-semibold text-[#9FEF00]"
          aria-hidden
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            initials.slice(0, 2)
          )}
        </div>
        <div>
          <p className="text-base font-medium text-[#F4F4F4]">Upload your avatar</p>
          <p className="mt-1 text-sm text-[#8799B5]">Avatar should be at least 300×300 pixels.</p>
          <p className="text-sm text-[#8799B5]">We support .png, .jpg, .jpeg.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <SettingsButton type="button" onClick={() => inputRef.current?.click()}>
          Upload avatar
        </SettingsButton>
        <SettingsButton
          type="button"
          variant="danger-icon"
          aria-label="Remove avatar"
          onClick={() => {
            setPreview(null);
            onAvatarChange(null);
          }}
        >
          <Trash2 className="size-4" strokeWidth={2.25} />
        </SettingsButton>
      </div>
    </div>
  );
}
