export const SANDBOX_DEFAULTS = {
  image: 'labpath-sandbox:local',
  maxMemoryMb: 512,
  maxWallClockS: 30,
  dockerNetwork: 'labpath_sandbox',
  gatewayUrl: 'http://sandbox-gateway:8080',
  gatewayHost: 'sandbox-gateway',
  gatewayPort: 8080,
  pidsLimit: 64,
  tmpfsSizeMb: 16,
} as const;

export const SANDBOX_ALLOWED_ENV = [
  'SANDBOX_GATEWAY_URL',
  'PYTHONUNBUFFERED',
] as const;

export const SANDBOX_FORBIDDEN_FILE_PATTERNS = [
  'eval_hidden',
  '.env',
  'credentials',
] as const;

export const SANDBOX_ERROR_CODES = {
  OK: 'sandbox_ok',
  TIMEOUT: 'sandbox_timeout',
  OOM: 'sandbox_oom',
  RUNTIME_UNAVAILABLE: 'sandbox_runtime_unavailable',
  RUNTIME_ERROR: 'sandbox_runtime_error',
  EGRESS_BLOCKED: 'sandbox_egress_blocked',
} as const;

export type SandboxErrorCode =
  (typeof SANDBOX_ERROR_CODES)[keyof typeof SANDBOX_ERROR_CODES];
