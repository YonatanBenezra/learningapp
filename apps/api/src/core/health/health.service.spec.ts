import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('HealthService', () => {
  const prisma = { isReady: jest.fn() } as unknown as PrismaService;
  const redis = { ping: jest.fn() } as unknown as RedisService;
  const service = new HealthService(prisma, redis);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('liveness does not depend on infra', () => {
    expect(service.liveness()).toEqual({
      status: 'ok',
      service: 'labpath-api',
    });
  });

  it('ready is ok only when postgres and redis are up', async () => {
    jest.spyOn(prisma, 'isReady').mockResolvedValue(true);
    jest.spyOn(redis, 'ping').mockResolvedValue(true);

    await expect(service.readiness()).resolves.toEqual({
      status: 'ok',
      service: 'labpath-api',
      checks: { postgres: 'up', redis: 'up' },
    });
  });

  it('ready is unavailable when postgres is down', async () => {
    jest.spyOn(prisma, 'isReady').mockResolvedValue(false);
    jest.spyOn(redis, 'ping').mockResolvedValue(true);

    await expect(service.readiness()).resolves.toEqual({
      status: 'unavailable',
      service: 'labpath-api',
      checks: { postgres: 'down', redis: 'up' },
    });
  });
});
