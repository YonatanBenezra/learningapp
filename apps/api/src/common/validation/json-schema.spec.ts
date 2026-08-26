import {
  canonicalJson,
  validateJsonSchema,
  type JsonSchema,
} from './json-schema';

describe('validateJsonSchema', () => {
  const schema: JsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['chunkSize', 'overlap', 'splitStrategy'],
    properties: {
      chunkSize: { type: 'integer', minimum: 50, maximum: 2000 },
      overlap: { type: 'integer', minimum: 0, maximum: 400 },
      splitStrategy: {
        type: 'string',
        enum: ['fixed', 'sentence', 'recursive', 'heading-aware'],
      },
    },
  };

  it('accepts a valid R1 payload', () => {
    expect(
      validateJsonSchema(schema, {
        chunkSize: 400,
        overlap: 50,
        splitStrategy: 'sentence',
      }),
    ).toEqual([]);
  });

  it('rejects missing fields, extras, and out-of-range integers', () => {
    expect(validateJsonSchema(schema, { chunkSize: 400 })).toContain(
      'missing required property: overlap',
    );
    expect(
      validateJsonSchema(schema, {
        chunkSize: 10,
        overlap: 0,
        splitStrategy: 'sentence',
      }),
    ).toContain('chunkSize must be >= 50');
    expect(
      validateJsonSchema(schema, {
        chunkSize: 400,
        overlap: 50,
        splitStrategy: 'sentence',
        extra: true,
      }),
    ).toContain('unexpected property: extra');
  });

  it('canonicalJson is key-order stable', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });
});
