import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .strict();

export const oauthGoogleSchema = z
  .object({
    idToken: z.string().min(1),
  })
  .strict();
