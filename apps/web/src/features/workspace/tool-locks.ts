import type { ExerciseTool, ExerciseTools, ToolStage } from "@/types/tools";

/** What a practice workspace needs to grey out tools the learner lacks. */
export type ToolLocks = {
  cost: number;
  tools: ExerciseTool[];
  /** Staged levels inside this exercise; empty for most. */
  stages: ToolStage[];
  /** Unlock a tool early for rating points. */
  onUnlock?: (toolId: string) => Promise<void>;
  /** Read the tools again, e.g. after a staged level was won. */
  onRefresh?: () => void;
};

export function toolLocksFrom(
  data: ExerciseTools | null,
  onUnlock?: (toolId: string) => Promise<void>,
  onRefresh?: () => void,
): ToolLocks | null {
  if (!data || !data.track || data.tools.length === 0) {
    return null;
  }
  return {
    cost: data.cost,
    tools: data.tools,
    stages: data.stages ?? [],
    onUnlock,
    onRefresh,
  };
}

/** The tool that sets a field, if any. */
export function toolForField(
  locks: ToolLocks | null,
  field: string,
): ExerciseTool | null {
  return locks?.tools.find((tool) => tool.fields.includes(field)) ?? null;
}

/** Fields of locked tools, with the value they are held at. */
export function lockedDefaults(
  locks: ToolLocks | null,
  schema: unknown,
): Record<string, unknown> {
  if (!locks) {
    return {};
  }
  const properties =
    (schema as { properties?: Record<string, { default?: unknown }> })
      ?.properties ?? {};
  const out: Record<string, unknown> = {};
  for (const tool of locks.tools) {
    if (tool.state !== "locked") {
      continue;
    }
    for (const field of tool.fields) {
      if (field in properties) {
        out[field] = properties[field]?.default;
      }
    }
  }
  return out;
}

export type ToolGroup<T> = { tool: ExerciseTool | null; fields: T[] };

/**
 * Fields grouped by tool: the exercise's new tools first, then the ones the
 * learner holds, then the locked ones, each in ladder order.
 */
export function groupFieldsByTool<T extends [string, unknown]>(
  fields: T[],
  locks: ToolLocks,
): ToolGroup<T>[] {
  const rank = { new: 0, unlocked: 1, locked: 2 } as const;
  const tools = [...locks.tools].sort(
    (a, b) => rank[a.state] - rank[b.state] || a.step - b.step,
  );
  const groups: ToolGroup<T>[] = [];
  for (const tool of tools) {
    const own = fields.filter(([key]) => tool.fields.includes(key));
    if (own.length > 0) {
      groups.push({ tool, fields: own });
    }
  }
  const rest = fields.filter(
    ([key]) => !tools.some((tool) => tool.fields.includes(key)),
  );
  if (rest.length > 0) {
    groups.unshift({ tool: null, fields: rest });
  }
  return groups;
}

const FEATURE_KEYS: Record<string, string> = {
  normalize: "normalize",
  strip_args: "strip_args",
  judge_from: "judge",
};

/**
 * Defence-language features a G3 filter or tool policy uses. A line-based
 * mirror of the server's check, for the editor's warning; the server's
 * structural check is the one that counts.
 */
export function dslFeaturesIn(yaml: string): Set<string> {
  const found = new Set<string>();
  for (const raw of yaml.split("\n")) {
    const line = raw.replace(/^\s*-\s*/, "").trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const match = /^([a-z_]+)\s*:\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }
    const [, key, rest] = match;
    const value = rest.replace(/\s+#.*$/, "").replace(/^['"]|['"]$/g, "");
    if (FEATURE_KEYS[key]) {
      found.add(FEATURE_KEYS[key]);
    } else if (key === "action" && value === "redact") {
      found.add("redact");
    } else if (
      key === "check" &&
      ["classifier", "judge", "urls_allowed"].includes(value)
    ) {
      found.add(value);
    }
  }
  return found;
}

/** Locked G3 tools the given filters or tool policy use. */
export function lockedFeaturesUsed(
  locks: ToolLocks | null,
  yamls: string[],
): ExerciseTool[] {
  if (!locks) {
    return [];
  }
  const used = new Set<string>();
  for (const yaml of yamls) {
    dslFeaturesIn(yaml).forEach((feature) => used.add(feature));
  }
  return locks.tools.filter(
    (tool) =>
      tool.state === "locked" &&
      tool.features.some((feature) => used.has(feature)),
  );
}

/** The schema minus locked fields in `required`: a held default is valid. */
export function schemaWithoutLocked<
  T extends { required?: string[]; properties?: Record<string, unknown> },
>(schema: T, held: Record<string, unknown>): T {
  const keys = Object.keys(held);
  if (keys.length === 0) {
    return schema;
  }
  const required = schema.required ?? Object.keys(schema.properties ?? {});
  return { ...schema, required: required.filter((key) => !keys.includes(key)) };
}
