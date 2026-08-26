"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SchemaProperty = {
  type?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  default?: unknown;
};

type SubmissionSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, SchemaProperty>;
};

type SubmissionSurfaceProps = {
  schema?: unknown;
  disabled?: boolean;
  pending?: boolean;
  error?: string | null;
  onSubmit: (payload: Record<string, unknown>) => void;
};

export function SubmissionSurface({
  schema,
  disabled,
  pending,
  error,
  onSubmit,
}: SubmissionSurfaceProps) {
  const parsed = useMemo(() => asSchema(schema), [schema]);
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setValues(defaultsFrom(parsed));
  }, [parsed]);

  const fields = Object.entries(parsed.properties ?? {});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <section className="overflow-y-auto p-4">
      <h2 className="font-medium">Submission</h2>
      <p className="mt-1 text-sm opacity-70">
        Fields come from this exercise&apos;s public schema.
      </p>
      <form className="mt-4 flex max-w-2xl flex-col gap-3" onSubmit={handleSubmit}>
        {fields.map(([key, property]) => (
          <Field
            key={key}
            name={key}
            property={property}
            value={values[key]}
            onChange={(next) =>
              setValues((current) => ({ ...current, [key]: next }))
            }
          />
        ))}
        <button
          type="submit"
          disabled={disabled || pending || fields.length === 0}
          className="border px-3 py-2 text-sm"
        >
          {pending ? "Grading…" : "Submit"}
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </section>
  );
}

function Field({
  name,
  property,
  value,
  onChange,
}: {
  name: string;
  property: SchemaProperty;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = labelFor(name);
  if (property.enum && property.enum.length > 0) {
    return (
      <label className="text-sm">
        {label}
        <select
          name={name}
          value={String(value ?? property.enum[0])}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 block w-full border px-3 py-2"
        >
          {property.enum.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (property.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name={name}
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        {label}
      </label>
    );
  }
  if (property.type === "integer") {
    return (
      <label className="text-sm">
        {label}
        <input
          type="number"
          name={name}
          min={property.minimum}
          max={property.maximum}
          required
          value={typeof value === "number" ? value : (property.minimum ?? 0)}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-1 block w-full border px-3 py-2"
        />
      </label>
    );
  }
  const long =
    name.toLowerCase().includes("prompt") ||
    name.toLowerCase().includes("yaml") ||
    name.toLowerCase().includes("rubric") ||
    name.toLowerCase().includes("spec") ||
    name.toLowerCase().includes("content");
  return (
    <label className="text-sm">
      {label}
      {long ? (
        <textarea
          name={name}
          rows={8}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 block w-full border px-3 py-2 font-mono text-xs"
        />
      ) : (
        <input
          type="text"
          name={name}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 block w-full border px-3 py-2"
        />
      )}
    </label>
  );
}

function asSchema(value: unknown): SubmissionSchema {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as SubmissionSchema;
}

function defaultsFrom(schema: SubmissionSchema): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [key, property] of Object.entries(schema.properties ?? {})) {
    if (property.default !== undefined) {
      values[key] = property.default;
      continue;
    }
    if (property.enum && property.enum.length > 0) {
      values[key] = property.enum[0];
      continue;
    }
    if (property.type === "boolean") {
      values[key] = false;
      continue;
    }
    if (property.type === "integer") {
      values[key] = property.minimum ?? 0;
      continue;
    }
    values[key] = "";
  }
  return values;
}

function labelFor(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}
