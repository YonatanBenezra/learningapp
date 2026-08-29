import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.schema';
import { SANDBOX_DEFAULTS } from './sandbox.constants';
import { runSandboxJob } from './sandbox.runner';
import type {
  SandboxJobInput,
  SandboxJobResult,
  SandboxRuntimeConfig,
} from './sandbox.types';

@Injectable()
export class SandboxService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  runtimeConfig(): SandboxRuntimeConfig {
    return {
      image: this.config.get('SANDBOX_IMAGE', { infer: true }),
      maxMemoryMb: this.config.get('SANDBOX_MAX_MEMORY_MB', { infer: true }),
      maxWallClockS: this.config.get('SANDBOX_MAX_WALL_CLOCK_S', {
        infer: true,
      }),
      gatewayUrl: this.config.get('SANDBOX_GATEWAY_URL', { infer: true }),
      dockerNetwork: this.config.get('SANDBOX_DOCKER_NETWORK', { infer: true }),
      allowRuncFallback: this.config.get('SANDBOX_ALLOW_RUNC_FALLBACK', {
        infer: true,
      }),
    };
  }

  run(input: SandboxJobInput): Promise<SandboxJobResult> {
    const defaults = this.runtimeConfig();
    return runSandboxJob({
      image: defaults.image,
      maxMemoryMb: defaults.maxMemoryMb,
      maxWallClockS: defaults.maxWallClockS,
      gatewayUrl: defaults.gatewayUrl,
      dockerNetwork: defaults.dockerNetwork,
      allowRuncFallback: defaults.allowRuncFallback,
      ...input,
    });
  }
}

export { SANDBOX_DEFAULTS };
