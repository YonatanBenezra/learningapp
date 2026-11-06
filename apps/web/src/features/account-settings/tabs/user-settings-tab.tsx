"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { OutlinedCountryField } from "@/features/account-settings/components/outlined-country-field";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AvatarUploader } from "@/features/account-settings/components/avatar-uploader";
import { EmailRow } from "@/features/account-settings/components/email-row";
import { FilledField } from "@/features/account-settings/components/filled-field";
import { OutlinedField, OutlinedSelect } from "@/features/account-settings/components/outlined-field";
import { SectionCard } from "@/features/account-settings/components/section-card";
import { SettingsButton } from "@/features/account-settings/components/settings-button";
import { Toggle } from "@/features/account-settings/components/toggle";
import {
  persistBasicInfo,
  persistCareer,
  persistIsc2,
  persistSocial,
} from "@/features/account-settings/lib/persist-account-settings";
import { showSettingsSaved } from "@/features/account-settings/lib/settings-toast";
import { ApiError } from "@/lib/api-client";
import toast from "react-hot-toast";
import {
  CALLING_CODE_OPTIONS,
  getTimezoneOptions,
  YEARS_EXPERIENCE_OPTIONS,
} from "@/features/account-settings/lib/timezones";
import {
  basicInfoSchema,
  careerSchema,
  isc2Schema,
  secondaryEmailSchema,
  socialSchema,
  type BasicInfoValues,
  type CareerValues,
  type SocialValues,
} from "@/features/account-settings/schemas/user-settings-schemas";
import { mockUser, type MockUserSettings } from "@/lib/mock-user";

const timezoneOptions = getTimezoneOptions();

type UserSettingsTabProps = {
  initial: MockUserSettings;
  onPatch: (patch: Partial<MockUserSettings>) => void;
  onReload?: () => Promise<void>;
};

function settingsSaveError(caught: unknown) {
  const message =
    caught instanceof ApiError ? caught.message : "Could not save settings. Try again.";
  toast.error(message);
}

export function UserSettingsTab({ initial, onPatch, onReload }: UserSettingsTabProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [secondaryEmails, setSecondaryEmails] = useState(initial.secondaryEmails);
  const [addingEmail, setAddingEmail] = useState(false);

  const basicForm = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      username: initial.username,
      timezone: initial.timezone,
      fullName: initial.fullName,
      website: initial.website,
      country: initial.country,
      city: initial.city,
      callingCode: initial.callingCode,
      phone: initial.phone,
    },
    mode: "onChange",
  });

  const socialForm = useForm<SocialValues>({
    resolver: zodResolver(socialSchema),
    defaultValues: initial.social,
    mode: "onChange",
  });

  const isc2Form = useForm<{ isc2MemberId: string }>({
    resolver: zodResolver(isc2Schema),
    defaultValues: { isc2MemberId: initial.isc2MemberId },
    mode: "onChange",
  });

  const careerForm = useForm<CareerValues>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      openToWork: initial.openToWork,
      jobTitle: initial.jobTitle,
      yearsExperience: initial.yearsExperience,
    },
    mode: "onChange",
  });

  const emailForm = useForm<{ email: string }>({
    resolver: zodResolver(secondaryEmailSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  useEffect(() => {
    void basicForm.trigger();
    void socialForm.trigger();
    void isc2Form.trigger();
    void careerForm.trigger();
    // Validate once on mount so Save can enable after the user edits (isValid starts false).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per tab mount
  }, []);

  async function saveBasic(values: BasicInfoValues) {
    try {
      await persistBasicInfo(values, avatarUrl);
      await onReload?.();
      onPatch({ ...values, avatarUrl });
      basicForm.reset(values);
      setAvatarDirty(false);
      showSettingsSaved();
    } catch (caught) {
      settingsSaveError(caught);
    }
  }

  async function saveSocial(values: SocialValues) {
    try {
      await persistSocial(values);
      await onReload?.();
      onPatch({ social: values });
      socialForm.reset(values);
      showSettingsSaved();
    } catch (caught) {
      settingsSaveError(caught);
    }
  }

  async function saveIsc2(values: { isc2MemberId: string }) {
    try {
      await persistIsc2(values.isc2MemberId);
      await onReload?.();
      onPatch(values);
      isc2Form.reset(values);
      showSettingsSaved();
    } catch (caught) {
      settingsSaveError(caught);
    }
  }

  async function saveCareer(values: CareerValues) {
    try {
      await persistCareer(values);
      await onReload?.();
      onPatch(values);
      careerForm.reset(values);
      showSettingsSaved();
    } catch (caught) {
      settingsSaveError(caught);
    }
  }

  async function addSecondary(values: { email: string }) {
    setAddingEmail(true);
    const next = [...secondaryEmails, { id: crypto.randomUUID(), email: values.email }];
    setSecondaryEmails(next);
    onPatch({ secondaryEmails: next });
    emailForm.reset({ email: "" });
    setAddingEmail(false);
    showSettingsSaved("Email added");
  }

  const fieldGrid =
    "grid grid-cols-1 items-start sm:grid-cols-2 sm:gap-x-[18px] sm:gap-y-5 gap-y-5";
  const canSaveBasic =
    (basicForm.formState.isDirty || avatarDirty) &&
    basicForm.formState.isValid &&
    !basicForm.formState.isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        id="basic-information"
        className="scroll-mt-[calc(var(--height-platform-topbar,60px)+1rem)]"
        title="Basic Information"
        description={`Basic details that represent you across the ${brand.name} ecosystem.`}
      >
        <AvatarUploader
          fullName={basicForm.watch("fullName")}
          avatarUrl={avatarUrl}
          onAvatarChange={(url) => {
            setAvatarUrl(url);
            setAvatarDirty(true);
          }}
        />
        <form
          className="mt-6 space-y-6"
          onSubmit={basicForm.handleSubmit(saveBasic)}
          noValidate
        >
          <div className={fieldGrid}>
            <OutlinedField label="Username" error={basicForm.formState.errors.username?.message} {...basicForm.register("username")} />
            <OutlinedSelect
              label="Timezone"
              options={timezoneOptions}
              error={basicForm.formState.errors.timezone?.message}
              {...basicForm.register("timezone")}
            />
            <OutlinedField label="Full name" error={basicForm.formState.errors.fullName?.message} {...basicForm.register("fullName")} />
            <OutlinedField label="Website" error={basicForm.formState.errors.website?.message} {...basicForm.register("website")} />
            <Controller
              control={basicForm.control}
              name="country"
              render={({ field }) => (
                <OutlinedCountryField
                  value={field.value}
                  onChange={field.onChange}
                  disabled={basicForm.formState.isSubmitting}
                  error={basicForm.formState.errors.country?.message}
                />
              )}
            />
            <OutlinedField label="City" error={basicForm.formState.errors.city?.message} {...basicForm.register("city")} />
            <OutlinedSelect
              label="Calling code"
              options={CALLING_CODE_OPTIONS}
              error={basicForm.formState.errors.callingCode?.message}
              {...basicForm.register("callingCode")}
            />
            <OutlinedField label="Phone number" error={basicForm.formState.errors.phone?.message} {...basicForm.register("phone")} />
          </div>
          <div className="mt-6 border-t border-[#2A3547] pt-6">
            <SettingsButton
              type="submit"
              variant="large"
              loading={basicForm.formState.isSubmitting}
              disabled={!canSaveBasic}
              className={
                canSaveBasic
                  ? "!bg-[#9FEF00] !text-[#121C2B] hover:!bg-[#b2f233]"
                  : "!bg-[#242F40] !text-[#526177]"
              }
            >
              Save changes
            </SettingsButton>
            {!canSaveBasic && !basicForm.formState.isSubmitting ? (
              <p className="mt-2 text-xs text-[#8799B5]">
                Change a field above to enable save.
              </p>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Emails"
        description="Manage your primary email. Add secondary emails to claim perks and sync your organization account."
      >
        <EmailRow email={initial.primaryEmail} />
        <div className="mt-8">
          <h3 className="text-base font-medium text-[#F4F4F4]">Add Secondary Email Address</h3>
          <p className="mt-1 text-sm text-[#8799B5]">
            Secondary emails can be used for recovery and organization matching.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={emailForm.handleSubmit(addSecondary)}
          >
            <FilledField
              className="flex-1"
              placeholder="name@company.com"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register("email")}
            />
            <SettingsButton
              type="submit"
              loading={addingEmail}
              disabled={!emailForm.formState.isValid || !emailForm.formState.isDirty}
            >
              Add email
            </SettingsButton>
          </form>
          {secondaryEmails.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-[#8799B5]">
              {secondaryEmails.map((row) => (
                <li key={row.id}>{row.email}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Social Profiles" description="Link public profiles to your LabPath identity.">
        <form className="space-y-12" onSubmit={socialForm.handleSubmit(saveSocial)} noValidate>
          <div className="space-y-12">
            <FilledField
              label="Github"
              leftIcon={<Link2 className="size-4" />}
              placeholder="https://github.com/username"
              error={socialForm.formState.errors.github?.message}
              {...socialForm.register("github")}
            />
            <FilledField
              label="LinkedIn"
              leftIcon={<Link2 className="size-4" />}
              placeholder="https://linkedin.com/in/username"
              error={socialForm.formState.errors.linkedin?.message}
              {...socialForm.register("linkedin")}
            />
            <FilledField
              label="X.com"
              leftIcon={<span className="text-xs font-bold">𝕏</span>}
              placeholder="https://x.com/username"
              error={socialForm.formState.errors.x?.message}
              {...socialForm.register("x")}
            />
          </div>
          <div className="mt-6 border-t border-[#2A3547] pt-6">
            <SettingsButton
              type="submit"
              loading={socialForm.formState.isSubmitting}
              disabled={!socialForm.formState.isDirty || !socialForm.formState.isValid}
            >
              Save changes
            </SettingsButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Certification credits (ISC2-style CPE)">
        <p className="-mt-2 mb-6 max-w-[640px] text-sm text-[#8799B5]">
          Earn credits through{" "}
          <Link href={routes.practiceHub} className="text-[#B2F233] hover:underline">
            Labs
          </Link>{" "}
          and{" "}
          <Link href={routes.paths} className="text-[#B2F233] hover:underline">
            Academy
          </Link>
          . Enter your member ID to sync progress.
        </p>
        <form onSubmit={isc2Form.handleSubmit(saveIsc2)} className="space-y-6">
          <FilledField
            placeholder="ISC2 member ID"
            error={isc2Form.formState.errors.isc2MemberId?.message}
            {...isc2Form.register("isc2MemberId")}
          />
          <div className="mt-6 border-t border-[#2A3547] pt-6">
            <SettingsButton
              type="submit"
              loading={isc2Form.formState.isSubmitting}
              disabled={!isc2Form.formState.isDirty || !isc2Form.formState.isValid}
            >
              Save changes
            </SettingsButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        id="career"
        className="scroll-mt-[calc(var(--height-platform-topbar,60px)+1rem)]"
        title="Career"
      >
        <form onSubmit={careerForm.handleSubmit(saveCareer)} className="space-y-6">
          <Controller
            control={careerForm.control}
            name="openToWork"
            render={({ field }) => (
              <Toggle
                checked={field.value}
                onChange={field.onChange}
                label="Open to work opportunities"
              />
            )}
          />
          <div className={fieldGrid}>
            <FilledField
              label="Job title"
              placeholder="Security Engineer"
              error={careerForm.formState.errors.jobTitle?.message}
              {...careerForm.register("jobTitle")}
            />
            <div>
              <label htmlFor="years-exp" className="mb-2 block text-sm font-medium text-[#F4F4F4]">
                Years of experience
              </label>
              <select
                id="years-exp"
                className="h-10 w-full rounded-[4px] bg-[#1E2939] px-4 text-sm text-[#F4F4F4] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]"
                {...careerForm.register("yearsExperience")}
              >
                {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 border-t border-[#2A3547] pt-6">
            <SettingsButton
              type="submit"
              loading={careerForm.formState.isSubmitting}
              disabled={!careerForm.formState.isDirty || !careerForm.formState.isValid}
            >
              Save changes
            </SettingsButton>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

/** Seed for Storybook / tests */
export const userSettingsSeed = mockUser.settings;
