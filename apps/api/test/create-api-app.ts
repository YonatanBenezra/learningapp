import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { GradingModule } from '../src/modules/grading/grading.module';

export async function createApiApp(options?: {
  withWorker?: boolean;
}): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports:
      options?.withWorker === false ? [AppModule] : [AppModule, GradingModule],
  }).compile();
  const app = moduleFixture.createNestApplication({ bodyParser: false });
  configureApp(app);
  await app.init();
  return app;
}
