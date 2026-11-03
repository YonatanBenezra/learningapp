"use client";

import { Suspense, useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { DashboardWorkspaceShell } from "@/features/dashboard/components/dashboard-workspace-shell";
import {
  parseSettingsTab,
  SettingsTabs,
} from "@/features/account-settings/components/settings-tabs";
import { SecuritySettingsTab } from "@/features/account-settings/tabs/security-settings-tab";
import { UserSettingsTab } from "@/features/account-settings/tabs/user-settings-tab";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { mockUser, type MockUser } from "@/lib/mock-user";
import { useSearchParams } from "next/navigation";

function AccountSettingsContent() {
  const searchParams = useSearchParams();
  const tab = parseSettingsTab(searchParams.get("tab"));
  const { user } = useAuthSession();
  const [data, setData] = useState<MockUser>(() => ({
    ...mockUser,
    settings: {
      ...mockUser.settings,
      primaryEmail: user?.email ?? mockUser.settings.primaryEmail,
      fullName: user?.displayName ?? mockUser.settings.fullName,
      username: user?.profile?.slug ?? mockUser.settings.username,
    },
  }));

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        primaryEmail: user.email,
        fullName: user.displayName ?? prev.settings.fullName,
        username: user.profile?.slug ?? prev.settings.username,
      },
    }));
  }, [user]);

  if (!user) {
    return <GlobalLoader platform contained label="Loading settings…" />;
  }

  return (
    <DashboardWorkspaceShell user={user}>
      <main className="lp-dash-figma-main !gap-8 !pb-24 !pt-6 text-[#F4F4F4]">
        <SettingsTabs />
        {tab === "user" ? (
          <UserSettingsTab
            initial={data.settings}
            onPatch={(patch) =>
              setData((prev) => ({
                ...prev,
                settings: { ...prev.settings, ...patch },
              }))
            }
          />
        ) : (
          <SecuritySettingsTab
            security={data.security}
            username={data.settings.username}
            onSecurityPatch={(patch) =>
              setData((prev) => ({
                ...prev,
                security: { ...prev.security, ...patch },
              }))
            }
          />
        )}
      </main>
    </DashboardWorkspaceShell>
  );
}

export function AccountSettingsView() {
  return (
    <Suspense fallback={<GlobalLoader platform fullPage label="Loading settings…" />}>
      <AccountSettingsContent />
    </Suspense>
  );
}
