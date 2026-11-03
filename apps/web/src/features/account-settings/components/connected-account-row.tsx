"use client";

import { SettingsButton } from "@/features/account-settings/components/settings-button";
import type { MockConnectedAccount } from "@/lib/mock-user";

const PROVIDER_LABEL: Record<MockConnectedAccount["provider"], string> = {
  google: "G",
  github: "GH",
  discord: "D",
  linkedin: "in",
  microsoft: "M",
};

type ConnectedAccountRowProps = {
  account: MockConnectedAccount;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  pending?: boolean;
};

export function ConnectedAccountRow({
  account,
  onConnect,
  onDisconnect,
  pending,
}: ConnectedAccountRowProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#2A3547] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[4px] bg-[#1E2939] text-xs font-bold text-[#9FEF00]">
          {PROVIDER_LABEL[account.provider]}
        </span>
        <div>
          <p className="text-sm font-medium text-[#F4F4F4]">{account.name}</p>
          {account.connected && account.email ? (
            <p className="text-xs text-[#8799B5]">{account.email}</p>
          ) : (
            <p className="text-xs text-[#8799B5]">Not connected</p>
          )}
        </div>
      </div>
      {account.connected ? (
        <SettingsButton
          type="button"
          variant="danger-ghost"
          disabled={pending}
          onClick={() => onDisconnect(account.id)}
        >
          Disconnect
        </SettingsButton>
      ) : (
        <SettingsButton type="button" disabled={pending} onClick={() => onConnect(account.id)}>
          Connect
        </SettingsButton>
      )}
    </div>
  );
}
