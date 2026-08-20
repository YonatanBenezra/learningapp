import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { AppError } from '../src/common/errors/AppError';
import { errorMiddleware } from '../src/middlewares/error.middleware';
import { validate } from '../src/middlewares/validate.middleware';

function makeApp() {
  const app = express();
  app.use(express.json());

  // Route that throws a domain error (Express 4 forwards sync throws to the error middleware).
  app.get('/boom', () => {
    throw new AppError(418, "I'm a teapot", { hint: 'brew tea' });
  });

  // Route guarded by zod validation.
  app.post(
    '/echo',
    validate({ body: z.object({ name: z.string().min(1) }) }),
    (req, res) => res.json(req.body),
  );

  app.use(errorMiddleware);
  return app;
}

describe('errorMiddleware', () => {
  it('renders an AppError with its status code and details', async () => {
    const res = await request(makeApp()).get('/boom');
    expect(res.status).toBe(418);
    expect(res.body).toMatchObject({ error: "I'm a teapot", details: { hint: 'brew tea' } });
  });

  it('renders a ZodError as 400 with field errors', async () => {
    const res = await request(makeApp()).post('/echo').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toHaveProperty('name');
  });

  it('passes valid input through validate()', async () => {
    const res = await request(makeApp()).post('/echo').send({ name: 'Yonatan' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Yonatan' });
  });
});
