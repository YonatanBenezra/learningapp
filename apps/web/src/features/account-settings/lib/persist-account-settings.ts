import { authApi } from "@/features/auth/auth-api";
import { profileWorkspaceApi } from "@/features/profile/platform/profile-workspace-api";
import type {
  BasicInfoValues,
  CareerValues,
  SocialValues,
} from "@/features/account-settings/schemas/user-settings-schemas";

function httpAvatarUrl(url: string | null | undefined) {
  if (!url?.trim()) return undefined;
  if (url.startsWith("blob:")) return undefined;
  if (/^https?:\/\//i.test(url)) return url.trim();
  return undefined;
}

function socialsFromForm(values: SocialValues) {
  const rows: { platform: string; url: string }[] = [];
  if (values.github.trim()) rows.push({ platform: "GitHub", url: values.github.trim() });
  if (values.linkedin.trim()) rows.push({ platform: "LinkedIn", url: values.linkedin.trim() });
  if (values.x.trim()) rows.push({ platform: "X", url: values.x.trim() });
  return rows;
}

export async function persistBasicInfo(
  values: BasicInfoValues,
  avatarUrl: string | null,
) {
  await authApi.updateProfile({
    displayName: values.fullName.trim() || null,
    slug: values.username.trim() || null,
  });
  await profileWorkspaceApi.updateMeta({
    country: values.country.trim(),
    avatarUrl: httpAvatarUrl(avatarUrl),
    accountSettings: {
      timezone: values.timezone,
      city: values.city.trim(),
      phone: values.phone.trim(),
      callingCode: values.callingCode,
      website: values.website.trim(),
    },
  });
}

export async function persistSocial(values: SocialValues) {
  await profileWorkspaceApi.updateMeta({
    socials: socialsFromForm(values),
  });
}

export async function persistIsc2(isc2MemberId: string) {
  await profileWorkspaceApi.updateMeta({
    accountSettings: { isc2MemberId: isc2MemberId.trim() },
  });
}

export async function persistCareer(values: CareerValues) {
  await profileWorkspaceApi.updateMeta({
    accountSettings: {
      openToWork: values.openToWork,
      jobTitle: values.jobTitle.trim(),
      yearsExperience: values.yearsExperience,
    },
  });
}

export async function fetchAccountSettingsSource() {
  const [user, workspace] = await Promise.all([authApi.me(), profileWorkspaceApi.get()]);
  return { user, workspace };
}
