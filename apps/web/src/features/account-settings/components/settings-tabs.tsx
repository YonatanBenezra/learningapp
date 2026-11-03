"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type SettingsTabId = "user" | "security";

const TABS: { id: SettingsTabId; label: string }[] = [
  { id: "user", label: "User Settings" },
  { id: "security", label: "Security Settings" },
];

export function parseSettingsTab(raw: string | null): SettingsTabId {
  return raw === "security" ? "security" : "user";
}

export function SettingsTabs() {
  const searchParams = useSearchParams();
  const active = parseSettingsTab(searchParams.get("tab"));

  return (
    <div className="border-b border-[#2A3547]">
      <div className="flex gap-6" role="tablist" aria-label="Settings sections">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const href = tab.id === "user" ? "?" : "?tab=security";
          return (
            <Link
              key={tab.id}
              href={href}
              scroll={false}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "relative py-4 text-sm font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9FEF00]",
                isActive ? "text-[#F4F4F4]" : "text-[#8799B5] hover:text-[#F4F4F4]",
              )}
            >
              {tab.label}
              {isActive ? (
                <span
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-[#9FEF00]"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
