type SchemaProperty = {
  type?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  enum?: unknown[];
  default?: unknown;
};

type SubmissionSchema = {
  required?: string[];
  properties?: Record<string, SchemaProperty>;
};

function labelFor(name: string): string {
  const special: Record<string, string> = {
    suiteYaml: "Assertion suite (YAML)",
    sliceSpecYaml: "Slice Spec (YAML)",
    judgeRubric: "Judge rubric",
    judgePrompt: "Judge prompt",
    attackPrompt: "Attack prompt",
    pageContent: "Page content",
    systemPrompt: "System prompt",
    inputFilterYaml: "Input filter (YAML)",
    outputFilterYaml: "Output filter (YAML)",
    toolPolicyYaml: "Tool policy (YAML)",
    toolSchemas: "Tool schemas",
  };
  if (special[name]) {
    return special[name];
  }
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function isEmptyString(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
}

function validateField(
  key: string,
  property: SchemaProperty,
  value: unknown,
): string | null {
  const label = labelFor(key);

  if (property.type === "boolean") {
    return null;
  }

  if (property.type === "integer") {
    if (value === "" || value == null) {
      return `${label} is required`;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return `${label} must be a number`;
    }
    if (property.minimum != null && numeric < property.minimum) {
      return `${label} must be at least ${property.minimum}`;
    }
    if (property.maximum != null && numeric > property.maximum) {
      return `${label} must be at most ${property.maximum}`;
    }
    return null;
  }

  if (property.enum && property.enum.length > 0) {
    return null;
  }

  if (isEmptyString(value)) {
    return `${label} is required`;
  }

  const text = (value as string).trim();
  if (property.minLength != null && text.length < property.minLength) {
    return `${label} must be at least ${property.minLength} characters`;
  }

  return null;
}

export function validateSubmission(
  schema: SubmissionSchema,
  values: Record<string, unknown>,
): { ok: true } | { ok: false; message: string } {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? Object.keys(properties));

  for (const key of required) {
    const property = properties[key];
    if (!property) {
      continue;
    }
    const error = validateField(key, property, values[key]);
    if (error) {
      return { ok: false, message: error };
    }
  }

  const entries = Object.entries(properties);
  if (entries.length === 0) {
    return { ok: false, message: "Nothing to submit for this exercise." };
  }

  const hasContent = entries.some(([key, property]) => {
    if (property.type === "boolean" || property.enum?.length) {
      return false;
    }
    if (property.type === "integer") {
      const numeric = Number(values[key]);
      return Number.isFinite(numeric);
    }
    return typeof values[key] === "string" && (values[key] as string).trim().length > 0;
  });

  if (!hasContent) {
    return {
      ok: false,
      message: "Fill in the required fields before submitting.",
    };
  }

  return { ok: true };
}

export function asSubmissionSchema(value: unknown): SubmissionSchema {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as SubmissionSchema;
}
