import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export type HealthStatus = 'ok' | 'unavailable';
export type CheckState = 'up' | 'down';

export type LivenessResponse = {
  status: 'ok';
  service: 'labpath-api';
};

export type ReadinessResponse = {
  status: HealthStatus;
  service: 'labpath-api';
  checks: {
    postgres: CheckState;
    redis: CheckState;
  };
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  liveness(): LivenessResponse {
    return { status: 'ok', service: 'labpath-api' };
  }

  async readiness(): Promise<ReadinessResponse> {
    const [postgresUp, redisUp] = await Promise.all([
      this.prisma.isReady(),
      this.redis.ping(),
    ]);

    return {
      status: postgresUp && redisUp ? 'ok' : 'unavailable',
      service: 'labpath-api',
      checks: {
        postgres: postgresUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
      },
    };
  }
}
