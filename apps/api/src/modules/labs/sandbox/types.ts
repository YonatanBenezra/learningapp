// Provider-agnostic sandbox seam (§7.1). All untrusted execution goes through a
// SandboxProvider so the runtime (docker-local | firecracker | third-party) is
// swappable and tests can inject a fake instead of executing real code.

export interface SandboxSpec {
  image: string;
  argv: string[]; // command + args executed inside the container
  stdin?: string; // optional input piped to the process
  timeoutMs: number;
  memoryMb: number;
  cpus: number;
  pidsLimit: number;
  maxOutputBytes: number;
}

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  oom: boolean;
  launchFailed: boolean; // container never actually ran (daemon down, image missing, spawn error)
  durationMs: number;
}

export interface SandboxProvider {
  run(spec: SandboxSpec): Promise<SandboxResult>;
}
