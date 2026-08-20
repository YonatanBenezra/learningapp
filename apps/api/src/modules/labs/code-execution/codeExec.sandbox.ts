import { env } from '../../../config/env';
import { AppError } from '../../../common/errors/AppError';
import { consumeQuota, refundQuota } from '../../subscriptions/usageQuota.service';
import { getSandboxProvider } from '../sandbox/docker.provider';
import type { SandboxProvider, SandboxResult } from '../sandbox/types';

export type Language = 'javascript' | 'python' | 'shell';

interface LangConfig {
  image: string;
  argv: (code: string) => string[];
}

// Each language runs in a language-appropriate, resource-capped container (§2.1).
const LANGUAGES: Record<Language, LangConfig> = {
  javascript: { image: 'node:20-bullseye-slim', argv: (code) => ['node', '-e', code] },
  python: { image: 'python:3.12-slim', argv: (code) => ['python3', '-c', code] },
  shell: { image: 'alpine:latest', argv: (code) => ['sh', '-c', code] },
};

export function isSupportedLanguage(lang: string): lang is Language {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, lang);
}

export interface ExecuteInput {
  language: string;
  code: string;
  stdin?: string;
}

// Validates, charges the daily lab quota (§6 tier cap), then runs the untrusted
// code through the sandbox provider. Quota is charged AFTER validation and BEFORE
// execution so a rejected request never spends a lab run.
export async function executeCode(
  userId: string,
  tier: string,
  input: ExecuteInput,
  provider: SandboxProvider = getSandboxProvider(),
): Promise<SandboxResult> {
  if (!isSupportedLanguage(input.language)) {
    throw new AppError(400, `Unsupported language '${input.language}'.`);
  }
  if (typeof input.code !== 'string' || input.code.length === 0) {
    throw new AppError(400, 'Code is required.');
  }
  if (Buffer.byteLength(input.code, 'utf8') > env.labCodeMaxBytes) {
    throw new AppError(413, `Code exceeds the ${env.labCodeMaxBytes}-byte limit.`);
  }

  await consumeQuota(userId, tier, 'lab');

  const cfg = LANGUAGES[input.language];
  const result = await provider.run({
    image: cfg.image,
    argv: cfg.argv(input.code),
    stdin: input.stdin,
    timeoutMs: env.sandboxTimeoutMs,
    memoryMb: env.sandboxMaxMemoryMb,
    cpus: env.sandboxCpus,
    pidsLimit: env.sandboxPidsLimit,
    maxOutputBytes: env.sandboxMaxOutputBytes,
  });

  // The sandbox resolves (never throws) even when the container fails to launch.
  // If nothing actually ran, refund the lab unit and surface a 503 — a server-side
  // outage must not silently burn the user's daily allowance.
  if (result.launchFailed) {
    await refundQuota(userId, 'lab');
    throw new AppError(503, 'Sandbox is temporarily unavailable. Please try again.');
  }
  return result;
}
