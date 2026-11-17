import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { QueueModule } from './core/queue/queue.module';
import { LoggerModule } from './core/logger/logger.module';
import { GradingModule } from './modules/grading/grading.module';
import { LlmModule } from './modules/llm/llm.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    LlmModule,
    GradingModule,
  ],
})
export class WorkerModule {}
