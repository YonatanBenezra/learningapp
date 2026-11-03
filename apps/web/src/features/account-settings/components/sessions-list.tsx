"use client";

import Link from "next/link";
import { SettingsButton } from "@/features/account-settings/components/settings-button";
import type { MockSession } from "@/lib/mock-user";

type SessionsListProps = {
  sessions: MockSession[];
  onSignOut: (id: string) => void;
  onSignOutAll: () => void;
  pending?: boolean;
};

export function SessionsList({ sessions, onSignOut, onSignOutAll, pending }: SessionsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#8799B5]">
          If you see unfamiliar activity,{" "}
          <Link href="?tab=security" className="text-[#B2F233] hover:underline">
            change your password
          </Link>
          .
        </p>
        <SettingsButton type="button" variant="danger-ghost" disabled={pending} onClick={onSignOutAll}>
          Sign out of all devices
        </SettingsButton>
      </div>
      <ul className="divide-y divide-[#2A3547] rounded-md border border-[#2A3547]">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-[#F4F4F4]">
                {session.browser}{" "}
                <span className="font-normal text-[#8799B5]">· {session.os}</span>
              </p>
              <p className="mt-1 text-xs text-[#8799B5]">
                {session.location} · {session.lastActive}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {session.current ? (
                <span className="rounded-[4px] bg-[#9FEF00]/15 px-2 py-0.5 text-xs font-semibold text-[#9FEF00]">
                  Current
                </span>
              ) : (
                <SettingsButton
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => onSignOut(session.id)}
                >
                  Sign out
                </SettingsButton>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
