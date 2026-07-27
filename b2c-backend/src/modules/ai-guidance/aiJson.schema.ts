import { z } from 'zod';

/** Accept any JSON value from the provider; validate in domain parsers instead. */
export const RawAiJsonSchema = z.unknown();

export type RawAiJson = z.infer<typeof RawAiJsonSchema>;
