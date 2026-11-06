import type { ProfileWorkspace } from "@/features/profile/platform/types";
import type { MockUserSettings } from "@/lib/mock-user";
import type { User } from "@/types/user";

function socialUrl(socials: ProfileWorkspace["socials"], platform: string) {
  const row = socials.find((s) => s.platform.toLowerCase().includes(platform.toLowerCase()));
  return row?.url ?? "";
}

export function mapWorkspaceToAccountSettings(
  user: User,
  workspace: ProfileWorkspace,
): MockUserSettings {
  const acc = workspace.accountSettings ?? {};
  const timezone =
    typeof acc.timezone === "string"
      ? acc.timezone
      : typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC";

  return {
    username: workspace.username,
    timezone,
    fullName: user.displayName ?? workspace.name,
    website: typeof acc.website === "string" ? acc.website : "",
    country: workspace.country,
    city: typeof acc.city === "string" ? acc.city : "",
    callingCode: typeof acc.callingCode === "string" ? acc.callingCode : "+880",
    phone: typeof acc.phone === "string" ? acc.phone : "",
    avatarUrl: workspace.avatar,
    primaryEmail: workspace.email,
    secondaryEmails: [],
    social: {
      github: socialUrl(workspace.socials, "github") || "",
      linkedin: socialUrl(workspace.socials, "linkedin") || "",
      x: socialUrl(workspace.socials, "twitter") || socialUrl(workspace.socials, "x") || "",
    },
    isc2MemberId: typeof acc.isc2MemberId === "string" ? acc.isc2MemberId : "",
    openToWork: Boolean(acc.openToWork),
    jobTitle: typeof acc.jobTitle === "string" ? acc.jobTitle : "",
    yearsExperience:
      typeof acc.yearsExperience === "string"
        ? acc.yearsExperience
        : "0-2 years (Junior)",
  };
}
