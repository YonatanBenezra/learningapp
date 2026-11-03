import { z } from "zod";

export const basicInfoSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(32)
    .regex(/^[a-z0-9_-]+$/i, "Use letters, numbers, - or _"),
  timezone: z.string().min(1, "Select a timezone"),
  fullName: z.string().min(1, "Full name is required").max(80),
  website: z
    .string()
    .refine((val) => !val.trim() || /^https?:\/\/.+/i.test(val.trim()), {
      message: "Enter a valid URL",
    }),
  country: z.string().min(1, "Select a country"),
  city: z.string().max(80),
  callingCode: z.string().min(1),
  phone: z.string().max(24),
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

const optionalUrl = z.string().refine((val) => !val.trim() || /^https?:\/\/.+/i.test(val.trim()), {
  message: "Enter a valid URL",
});

export const socialSchema = z.object({
  github: optionalUrl,
  linkedin: optionalUrl,
  x: optionalUrl,
});

export type SocialValues = z.infer<typeof socialSchema>;

export const isc2Schema = z.object({
  isc2MemberId: z.string().max(32),
});

export const careerSchema = z.object({
  openToWork: z.boolean(),
  jobTitle: z.string().max(80),
  yearsExperience: z.string().min(1),
});

export type CareerValues = z.infer<typeof careerSchema>;

export const secondaryEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Current password is required"),
    next: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.next === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const twoFactorSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});

export const deleteAccountSchema = z.object({
  confirmUsername: z.string().min(1, "Type your username to confirm"),
});
