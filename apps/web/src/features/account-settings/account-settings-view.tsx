"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { mapWorkspaceToAccountSettings } from "@/features/account-settings/lib/map-account-settings";
import { fetchAccountSettingsSource } from "@/features/account-settings/lib/persist-account-settings";
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
  const { user, resolved: sessionResolved } = useAuthSession();
  const [data, setData] = useState<MockUser | null>(null);
  const [loadError, setLoadError] = useState(false);
  /** Remount settings forms after reload so react-hook-form picks up fresh server values. */
  const [settingsFormKey, setSettingsFormKey] = useState(0);
  const isFirstSettingsLoad = useRef(true);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    setLoadError(false);
    try {
      const { user: me, workspace } = await fetchAccountSettingsSource();
      setData({
        settings: mapWorkspaceToAccountSettings(me, workspace),
        security: mockUser.security,
      });
      if (!isFirstSettingsLoad.current) {
        setSettingsFormKey((k) => k + 1);
      }
      isFirstSettingsLoad.current = false;
    } catch {
      setLoadError(true);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  if (!sessionResolved || !user || !data) {
    if (loadError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center bg-[#101927] px-6 text-sm text-[#8799B5]">
          Could not load settings. Is the API running?
        </div>
      );
    }
    return <GlobalLoader platform fullPage label="Loading settings…" />;
  }

  return (
    <main className="lp-dash-figma-main !gap-8 !pb-24 !pt-6 text-[#F4F4F4]">
      <SettingsTabs />
      {tab === "user" ? (
        <UserSettingsTab
          key={`${settingsFormKey}-${data.settings.username}-${data.settings.country}-${data.settings.jobTitle}`}
          initial={data.settings}
          onPatch={(patch) =>
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    settings: { ...prev.settings, ...patch },
                  }
                : prev,
            )
          }
          onReload={loadSettings}
        />
      ) : (
        <SecuritySettingsTab
          security={data.security}
          username={data.settings.username}
          onSecurityPatch={(patch) =>
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    security: { ...prev.security, ...patch },
                  }
                : prev,
            )
          }
        />
      )}
    </main>
  );
}

export function AccountSettingsView() {
  return (
    <Suspense fallback={<GlobalLoader platform fullPage label="Loading settings…" />}>
      <AccountSettingsContent />
    </Suspense>
  );
}
