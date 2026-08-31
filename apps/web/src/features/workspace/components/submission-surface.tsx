"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
  errorHref?: string | null;
  errorLinkLabel?: string | null;
  initialValues?: Record<string, unknown>;
  lead?: string;
  onSubmit: (payload: Record<string, unknown>) => void;
};

export function SubmissionSurface({
  schema,
  disabled,
  pending,
  error,
  errorHref,
  errorLinkLabel,
  initialValues,
  lead,
  onSubmit,
}: SubmissionSurfaceProps) {
  const parsed = useMemo(() => asSchema(schema), [schema]);
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setValues({ ...defaultsFrom(parsed), ...initialValues });
  }, [parsed, initialValues]);

  const fields = Object.entries(parsed.properties ?? {});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <>
      <div className="lp-ws-pane-head">
        <h2 className="lp-ws-pane-title">Submission</h2>
        <p className="lp-ws-pane-lead">
          {lead ?? "Configure the public fields, then grade this run."}
        </p>
      </div>
      <section className="lp-ws-pane-body">
        <form className="lp-ws-form" onSubmit={handleSubmit}>
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
          <div className="lp-ws-form-actions">
            <button
              type="submit"
              disabled={disabled || pending || fields.length === 0}
              className="lp-btn lp-btn-primary lp-ws-submit"
            >
              {pending ? "Grading…" : "Submit"}
            </button>
            {error ? (
              <p className="lp-ws-error">
                {error}
                {errorHref ? (
                  <>
                    {" "}
                    <Link href={errorHref} className="lp-link">
                      {errorLinkLabel ?? "Open billing"}
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </>
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
  const wide = isWideField(property);
  if (property.enum && property.enum.length > 0) {
    return (
      <label className={wide ? "lp-field lp-ws-field--wide" : "lp-field"}>
        <span className="lp-field-label">{label}</span>
        <span className="lp-ws-select">
          <select
            name={name}
            value={String(value ?? property.enum[0] ?? "")}
            onChange={(event) => onChange(event.target.value)}
            className="lp-field-input"
          >
            {property.enum.map((option) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ))}
          </select>
        </span>
      </label>
    );
  }
  if (property.type === "boolean") {
    return (
      <label className="lp-ws-check lp-ws-field--wide">
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
      <label className={wide ? "lp-field lp-ws-field--wide" : "lp-field"}>
        <span className="lp-field-label">{label}</span>
        <input
          type="number"
          name={name}
          min={property.minimum}
          max={property.maximum}
          required
          inputMode="numeric"
          placeholder={placeholderFor(property)}
          value={value === "" || value == null ? "" : String(value)}
          onChange={(event) => onChange(parseInteger(event.target.value))}
          className="lp-field-input"
        />
        <RangeHint property={property} />
      </label>
    );
  }
  const long = isLongField(name);
  return (
    <label className="lp-field lp-ws-field--wide">
      <span className="lp-field-label">{label}</span>
      {long ? (
        <textarea
          name={name}
          rows={7}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="lp-field-input"
        />
      ) : (
        <input
          type="text"
          name={name}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="lp-field-input"
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
    if (property.type === "integer") {
      values[key] = "";
      continue;
    }
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
    values[key] = "";
  }
  return values;
}

function parseInteger(raw: string): number | "" {
  if (raw.trim() === "") {
    return "";
  }
  const next = Number(raw);
  return Number.isFinite(next) ? next : "";
}

function isLongField(name: string) {
  const key = name.toLowerCase();
  return (
    key.includes("prompt") ||
    key.includes("yaml") ||
    key.includes("rubric") ||
    key.includes("spec") ||
    key.includes("content") ||
    key.includes("source") ||
    key.includes("schema")
  );
}

function isWideField(property: SchemaProperty) {
  return property.type !== "integer";
}

function placeholderFor(property: SchemaProperty) {
  if (typeof property.default === "number") {
    return String(property.default);
  }
  return "";
}

function RangeHint({ property }: { property: SchemaProperty }) {
  if (property.minimum == null && property.maximum == null) {
    return null;
  }
  const min = property.minimum ?? "—";
  const max = property.maximum ?? "—";
  return <span className="lp-ws-field-hint">{min}–{max}</span>;
}

function labelFor(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}
