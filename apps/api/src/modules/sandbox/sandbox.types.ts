import type { SandboxErrorCode } from './sandbox.constants';

export type SandboxJobInput = {
  source: string;
  workspaceFiles?: Record<string, string>;
  image?: string;
  maxMemoryMb?: number;
  maxWallClockS?: number;
  gatewayUrl?: string;
  dockerNetwork?: string;
  allowRuncFallback?: boolean;
};

export type SandboxJobResult = {
  ok: boolean;
  errorCode: SandboxErrorCode;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  memoryPeakMb: number | null;
  runtime: 'runsc' | 'runc';
  containerId?: string;
};

export type SandboxRuntimeConfig = {
  image: string;
  maxMemoryMb: number;
  maxWallClockS: number;
  gatewayUrl: string;
  dockerNetwork: string;
  allowRuncFallback: boolean;
};
