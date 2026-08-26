export type JsonSchema = {
  type?: string;
  additionalProperties?: boolean;
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
};

export type JsonSchemaProperty = {
  type?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  default?: unknown;
};

export function validateJsonSchema(
  schema: JsonSchema,
  payload: unknown,
): string[] {
  const errors: string[] = [];
  if (schema.type === 'object') {
    if (
      payload === null ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      return ['payload must be an object'];
    }
    const record = payload as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in record)) {
        errors.push(`missing required property: ${key}`);
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(record)) {
        if (!allowed.has(key)) {
          errors.push(`unexpected property: ${key}`);
        }
      }
    }
    for (const [key, property] of Object.entries(schema.properties ?? {})) {
      if (key in record) {
        errors.push(...validateProperty(key, property, record[key]));
      }
    }
  }
  return errors;
}

function validateProperty(
  key: string,
  property: JsonSchemaProperty,
  value: unknown,
): string[] {
  if (property.enum && !property.enum.includes(value)) {
    return [`${key} must be one of: ${property.enum.join(', ')}`];
  }
  if (property.type === 'integer') {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return [`${key} must be an integer`];
    }
    if (property.minimum !== undefined && value < property.minimum) {
      return [`${key} must be >= ${property.minimum}`];
    }
    if (property.maximum !== undefined && value > property.maximum) {
      return [`${key} must be <= ${property.maximum}`];
    }
  }
  if (property.type === 'boolean' && typeof value !== 'boolean') {
    return [`${key} must be a boolean`];
  }
  if (property.type === 'string' && typeof value !== 'string') {
    return [`${key} must be a string`];
  }
  return [];
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}
