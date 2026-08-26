import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

process.env.LABPATH_PROCESS = 'worker';

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
}

void bootstrap();
