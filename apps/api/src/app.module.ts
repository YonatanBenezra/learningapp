import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { QueueModule } from './core/queue/queue.module';
import { LoggerModule } from './core/logger/logger.module';
import { HealthModule } from './core/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { PracticeModule } from './modules/practice/practice.module';
import { ProgressModule } from './modules/progress/progress.module';
import { IngestModule } from './modules/ingest/ingest.module';
import { CostModule } from './modules/cost/cost.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    IdentityModule,
    CatalogueModule,
    PracticeModule,
    ProgressModule,
    IngestModule,
    CostModule,
  ],
})
export class AppModule {}
