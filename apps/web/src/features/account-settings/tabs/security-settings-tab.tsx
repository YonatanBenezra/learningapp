"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ConfirmModal } from "@/features/account-settings/components/confirm-modal";
import { ConnectedAccountRow } from "@/features/account-settings/components/connected-account-row";
import { OutlinedField } from "@/features/account-settings/components/outlined-field";
import { SectionCard } from "@/features/account-settings/components/section-card";
import { SessionsList } from "@/features/account-settings/components/sessions-list";
import { SettingsButton } from "@/features/account-settings/components/settings-button";
import { showSettingsSaved } from "@/features/account-settings/lib/settings-toast";
import {
  changePasswordSchema,
  deleteAccountSchema,
  twoFactorSchema,
  type ChangePasswordValues,
} from "@/features/account-settings/schemas/user-settings-schemas";
import { delaySave, type MockSecuritySettings, type MockUserSettings } from "@/lib/mock-user";

type SecuritySettingsTabProps = {
  security: MockSecuritySettings;
  username: string;
  onSecurityPatch: (patch: Partial<MockSecuritySettings>) => void;
};

function passwordStrength(label: string): { width: string; color: string; text: string } {
  const len = label.length;
  if (len >= 12) return { width: "100%", color: "#9FEF00", text: "Strong" };
  if (len >= 8) return { width: "66%", color: "#B2F233", text: "Good" };
  if (len >= 1) return { width: "33%", color: "#8799B5", text: "Weak" };
  return { width: "0%", color: "#8799B5", text: "" };
}

function SecurityRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-semibold text-[#F4F4F4]">{title}</h3>
        <p className="mt-1 max-w-xl text-sm text-[#8799B5]">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function SecuritySettingsTab({
  security,
  username,
  onSecurityPatch,
}: SecuritySettingsTabProps) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
    mode: "onChange",
  });

  const twoFaForm = useForm<{ code: string }>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
    mode: "onChange",
  });

  const deleteForm = useForm<{ confirmUsername: string }>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmUsername: "" },
    mode: "onChange",
  });

  const nextPassword = passwordForm.watch("next");
  const strength = passwordStrength(nextPassword);

  async function submitPassword(values: ChangePasswordValues) {
    setPending(true);
    await delaySave();
    setPending(false);
    passwordForm.reset();
    setPasswordOpen(false);
    onSecurityPatch({ passwordLastChanged: new Date().toISOString().slice(0, 10) });
    showSettingsSaved("Password updated");
    void values;
  }

  async function enable2fa(values: { code: string }) {
    setPending(true);
    await delaySave();
    setPending(false);
    twoFaForm.reset();
    setTwoFaOpen(false);
    onSecurityPatch({ twoFactorEnabled: true });
    showSettingsSaved("Two-factor authentication enabled");
    void values;
  }

  async function deleteAccount() {
    setPending(true);
    await delaySave();
    setPending(false);
    setDeleteOpen(false);
    showSettingsSaved("Account deletion requested");
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Password" description="Use a strong password you do not reuse elsewhere.">
        <SecurityRow
          title="Password"
          description={`Last changed ${security.passwordLastChanged}.`}
          action={
            <SettingsButton type="button" onClick={() => setPasswordOpen(true)}>
              Change Password
            </SettingsButton>
          }
        />
      </SectionCard>

      <SectionCard
        title="Two-factor authentication"
        description="Add an extra layer of security to your account."
      >
        <SecurityRow
          title="Authenticator app"
          description={
            security.twoFactorEnabled
              ? "2FA is enabled on your account."
              : "Protect your account with a time-based one-time code."
          }
          action={
            security.twoFactorEnabled ? (
              <span className="text-sm font-medium text-[#9FEF00]">Enabled</span>
            ) : (
              <SettingsButton type="button" onClick={() => setTwoFaOpen(true)}>
                Enable 2FA
              </SettingsButton>
            )
          }
        />
      </SectionCard>

      <SectionCard title="Connected accounts" description="Link sign-in providers to your LabPath account.">
        <div>
          {security.connectedAccounts.map((account) => (
            <ConnectedAccountRow
              key={account.id}
              account={account}
              pending={pending}
              onConnect={async (id) => {
                setPending(true);
                await delaySave();
                onSecurityPatch({
                  connectedAccounts: security.connectedAccounts.map((a) =>
                    a.id === id ? { ...a, connected: true, email: "linked@example.com" } : a,
                  ),
                });
                setPending(false);
                showSettingsSaved();
              }}
              onDisconnect={async (id) => {
                setPending(true);
                await delaySave();
                onSecurityPatch({
                  connectedAccounts: security.connectedAccounts.map((a) =>
                    a.id === id ? { ...a, connected: false, email: undefined } : a,
                  ),
                });
                setPending(false);
                showSettingsSaved();
              }}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Active sessions" description="Devices currently signed in to your account.">
        <SessionsList
          sessions={security.sessions}
          pending={pending}
          onSignOut={async (id) => {
            setPending(true);
            await delaySave();
            onSecurityPatch({
              sessions: security.sessions.filter((s) => s.id !== id),
            });
            setPending(false);
            showSettingsSaved();
          }}
          onSignOutAll={async () => {
            setPending(true);
            await delaySave();
            onSecurityPatch({
              sessions: security.sessions.filter((s) => s.current),
            });
            setPending(false);
            showSettingsSaved("Signed out of other devices");
          }}
        />
      </SectionCard>

      <SectionCard title="Privacy / cookies">
        <SecurityRow
          title="Cookie consent"
          description={`Your current preference: ${security.cookieConsent}.`}
          action={<SettingsButton type="button">Change your consent</SettingsButton>}
        />
      </SectionCard>

      <SectionCard
        title="Danger zone"
        description="Irreversible actions for your LabPath account."
        danger
      >
        <div className="flex flex-wrap gap-4">
          <SettingsButton type="button" variant="danger-ghost" onClick={() => setDeleteOpen(true)}>
            Delete account
          </SettingsButton>
          <SettingsButton type="button" variant="ghost">
            Contact Support
          </SettingsButton>
        </div>
      </SectionCard>

      <ConfirmModal
        open={passwordOpen}
        title="Change password"
        onClose={() => setPasswordOpen(false)}
        confirmLabel="Update password"
        onConfirm={passwordForm.handleSubmit(submitPassword)}
        confirmDisabled={!passwordForm.formState.isValid || !passwordForm.formState.isDirty}
        confirmLoading={passwordForm.formState.isSubmitting || pending}
      >
        <form className="grid gap-4 pt-2" onSubmit={passwordForm.handleSubmit(submitPassword)}>
          <OutlinedField
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={passwordForm.formState.errors.current?.message}
            {...passwordForm.register("current")}
          />
          <OutlinedField
            label="New password"
            type="password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.next?.message}
            {...passwordForm.register("next")}
          />
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1E2939]">
              <div
                className="h-full transition-all duration-300"
                style={{ width: strength.width, backgroundColor: strength.color }}
              />
            </div>
            {strength.text ? (
              <p className="mt-1 text-xs text-[#8799B5]">Strength: {strength.text}</p>
            ) : null}
          </div>
          <OutlinedField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.confirm?.message}
            {...passwordForm.register("confirm")}
          />
        </form>
      </ConfirmModal>

      <ConfirmModal
        open={twoFaOpen}
        title="Enable two-factor authentication"
        onClose={() => setTwoFaOpen(false)}
        confirmLabel="Verify & enable"
        onConfirm={twoFaForm.handleSubmit(enable2fa)}
        confirmDisabled={!twoFaForm.formState.isValid || !twoFaForm.formState.isDirty}
        confirmLoading={twoFaForm.formState.isSubmitting || pending}
      >
        <div className="space-y-4 pt-2">
          <div className="mx-auto flex size-40 items-center justify-center rounded-lg border border-dashed border-[#3A4559] bg-[#1E2939] text-xs text-[#8799B5]">
            QR code placeholder
          </div>
          <p className="text-sm">Scan with your authenticator app, then enter the 6-digit code.</p>
          <OutlinedField
            label="Authentication code"
            inputMode="numeric"
            maxLength={6}
            error={twoFaForm.formState.errors.code?.message}
            {...twoFaForm.register("code")}
          />
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={deleteOpen}
        title="Delete account"
        onClose={() => setDeleteOpen(false)}
        confirmLabel="Delete my account"
        danger
        onConfirm={deleteForm.handleSubmit(deleteAccount)}
        confirmDisabled={
          !deleteForm.formState.isValid ||
          deleteForm.watch("confirmUsername") !== username
        }
        confirmLoading={pending}
      >
        <p className="pt-2">
          This will permanently delete your account and data. Type{" "}
          <strong className="text-[#F4F4F4]">{username}</strong> to confirm.
        </p>
        <OutlinedField
          className="mt-4"
          label="Username"
          error={deleteForm.formState.errors.confirmUsername?.message}
          {...deleteForm.register("confirmUsername")}
        />
      </ConfirmModal>
    </div>
  );
}
