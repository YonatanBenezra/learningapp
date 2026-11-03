"use client";

import { SettingsButton } from "@/features/account-settings/components/settings-button";

type EmailRowProps = {
  email: string;
  onChangeEmail?: () => void;
};

export function EmailRow({ email, onChangeEmail }: EmailRowProps) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-[#2A3547] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-medium text-[#F4F4F4]">
          {email} <span className="text-[#8799B5]">— Primary</span>
        </p>
        <p className="mt-1 max-w-xl text-sm text-[#8799B5]">
          This email will be used for sign in, account-related notifications and security settings.
        </p>
      </div>
      <SettingsButton type="button" onClick={onChangeEmail}>
        Change email
      </SettingsButton>
    </div>
  );
}
