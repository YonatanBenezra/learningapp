import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";

type SchemaProperty = {
  type?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  default?: unknown;
  description?: string;
};

type SubmissionSchema = {
  required?: string[];
  properties?: Record<string, SchemaProperty>;
};

export type SubmitFieldGuide = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  type: string;
  constraints?: string;
};

export type ExerciseGuide = {
  goal: string;
  whatYouReceive: string[];
  howToSolve: string[];
  submitFields: SubmitFieldGuide[];
  constraints: string[];
};

const FIELD_DESCRIPTIONS: Record<string, string> = {
  chunkSize: "Token/character window for each chunk in the retriever index.",
  overlap: "Shared characters between adjacent chunks so answers split across boundaries still retrieve.",
  splitStrategy:
    "How the corpus is split: fixed size, sentence boundaries, recursive splits, or heading-aware sections.",
  suiteYaml: "YAML assertion suite — RE2 checks that must agree with hidden fail labels.",
  sliceSpecYaml: "YAML slice definition to find regressed cohorts with corrected significance.",
  judgeRubric: "Rubric text the LLM judge uses to score each reply.",
  judgePrompt: "System/user prompt template sent to the judge model.",
  attackPrompt: "Single jailbreak or override prompt tested against every defence level.",
  pageContent: "Untrusted page or document content the assistant may read as data.",
  systemPrompt: "System instructions that define allowed behaviour for the guarded model.",
  inputFilterYaml: "YAML rules applied to user input before the model sees it.",
  outputFilterYaml: "YAML rules applied to model output before it reaches the user.",
  toolPolicyYaml: "YAML policy for which tools the agent may call and when.",
};

export function buildExerciseGuide(exercise: Exercise): ExerciseGuide {
  const schema = asSchema(exercise.submissionSchema);
  const submitFields = fieldsFromSchema(schema);
  const simulatorLabel = SIMULATOR_LABELS[exercise.simulator] ?? exercise.simulator;

  return {
    goal: goalFromBrief(exercise.briefMd ?? "", exercise.title),
    whatYouReceive: whatYouReceiveFor(exercise.simulator, simulatorLabel),
    howToSolve: howToSolveFor(exercise.simulator, submitFields),
    submitFields,
    constraints: constraintsFor(exercise, submitFields),
  };
}

function goalFromBrief(briefMd: string, title: string): string {
  const blocks = briefMd.trim().split(/\n\n+/);
  for (const block of blocks) {
    if (/^#+\s/.test(block)) {
      continue;
    }
    if (block.startsWith(">")) {
      continue;
    }
    const text = block.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
    if (text.length > 0) {
      return text;
    }
  }
  return `Complete "${title}" and pass the hidden grading set.`;
}

function whatYouReceiveFor(simulator: Exercise["simulator"], label: string): string[] {
  const common = [
    "A problem brief with the goal, pass criteria, and any public samples.",
    "An editable submission form on the right — tune config or author YAML/prompts.",
    "After you submit, a scorecard with metrics, verdict, and up to a few failing cases.",
  ];

  const bySimulator: Partial<Record<Exercise["simulator"], string[]>> = {
    rag: [
      `A ${label} exercise: you receive retriever knobs and a hidden Q/A set.`,
      "The grader runs your chunking + retrieval config against questions you cannot see.",
      "You get recall/precision-style metrics and failing query notes — not the gold answers.",
    ],
    evaluation: [
      `A ${label} exercise: you receive labels metadata and a hidden eval set.`,
      "Your assertion suite, judge rubric, or slice spec is run against held-out tickets.",
      "You get F1, agreement, slice flags, and failing case snippets.",
    ],
    guardrails: [
      `A ${label} exercise: attack prompts or defence stacks against a fixed concierge model.`,
      "Probes run through your filters and system prompt on hidden scenarios.",
      "You get block rates, levels cleared, and notes on probes that still succeed.",
    ],
    prompt_engineering: [
      `A ${label} exercise with a fixed model and hidden ticket batch.`,
      "Your prompt template is applied to each ticket; outputs are checked automatically.",
    ],
    agent: [
      `An ${label} exercise with tool stubs and a hidden task set.`,
      "Your plan or tool sequence is replayed; success is measured on completion criteria.",
    ],
    neural_network: [
      `A ${label} lab with a training harness and hidden validation split.`,
      "Hyperparameters you set drive a short training run; metrics come back in the scorecard.",
    ],
    fine_tuning: [
      `A ${label} exercise with adapter/data choices and a hidden eval batch.`,
      "Your fine-tune config is graded on quality and constraint adherence.",
    ],
    benchmark: [
      `A ${label} run against a fixed benchmark slice.`,
      "Config changes are scored on the hidden portion of the benchmark.",
    ],
  };

  return bySimulator[simulator] ?? common;
}

function howToSolveFor(
  simulator: Exercise["simulator"],
  fields: SubmitFieldGuide[],
): string[] {
  const fieldHint =
    fields.length > 0
      ? `Fill in ${fields.map((f) => f.label).join(", ")} in the editor.`
      : "Configure the submission fields in the editor.";

  const bySimulator: Partial<Record<Exercise["simulator"], string[]>> = {
    rag: [
      "Read the goal and pass threshold in the description.",
      fieldHint,
      "Start from defaults, submit once to see baseline metrics.",
      "Adjust chunk size, overlap, or split strategy to raise recall without blowing cost.",
      "Submit again until the scorecard shows pass.",
    ],
    evaluation: [
      "Read the goal and which eval mode this exercise uses (assertions, judge, or slice).",
      fieldHint,
      "Draft minimal checks that catch the described failure mode.",
      "Submit to see F1, agreement, and failing tickets on the hidden set.",
      "Iterate on YAML or rubric wording until metrics meet the threshold.",
    ],
    guardrails: [
      "Identify whether you are authoring an attack, an inject page, or a defence stack.",
      fieldHint,
      "Submit to see which probe levels still succeed.",
      "Tighten filters or system prompt, or refine the attack until the scorecard passes.",
    ],
  };

  return (
    bySimulator[simulator] ?? [
      "Read the description and note the pass criteria.",
      fieldHint,
      "Submit to run the simulator on the hidden set.",
      "Use the scorecard failing samples to iterate.",
      "Resubmit until you pass.",
    ]
  );
}

function fieldsFromSchema(schema: SubmissionSchema): SubmitFieldGuide[] {
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties ?? {}).map(([key, property]) => ({
    key,
    label: labelFor(key),
    description: property.description ?? FIELD_DESCRIPTIONS[key] ?? describeField(key, property),
    required: required.has(key),
    type: fieldTypeLabel(property),
    constraints: fieldConstraints(property),
  }));
}

function constraintsFor(
  exercise: Exercise,
  fields: SubmitFieldGuide[],
): string[] {
  const rows: string[] = [];
  for (const field of fields) {
    if (field.constraints) {
      rows.push(`${field.label}: ${field.constraints}`);
    }
  }
  if (rows.length === 0) {
    rows.push("All required fields in the submission form must be valid before grading.");
  }
  rows.push("Grading uses a hidden test set — public samples (if any) are illustrative only.");
  if (exercise.difficulty === "H") {
    rows.push("Hard exercises may require several submit iterations to pass.");
  }
  return rows;
}

function asSchema(value: unknown): SubmissionSchema {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as SubmissionSchema;
}

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
  };
  if (special[name]) {
    return special[name];
  }
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function describeField(key: string, property: SchemaProperty): string {
  if (property.enum && property.enum.length > 0) {
    return `One of: ${property.enum.map(String).join(", ")}.`;
  }
  if (property.type === "integer") {
    return "Numeric parameter for this exercise.";
  }
  if (property.type === "boolean") {
    return "Toggle this option on or off.";
  }
  const lower = key.toLowerCase();
  if (lower.includes("yaml") || lower.includes("spec")) {
    return "YAML document consumed by the grader.";
  }
  if (lower.includes("prompt")) {
    return "Prompt text sent to the model or judge.";
  }
  return "Value submitted for grading.";
}

function fieldTypeLabel(property: SchemaProperty): string {
  if (property.enum && property.enum.length > 0) {
    return "enum";
  }
  return property.type ?? "string";
}

function fieldConstraints(property: SchemaProperty): string | undefined {
  const parts: string[] = [];
  if (property.type === "integer") {
    if (property.minimum != null) {
      parts.push(`min ${property.minimum}`);
    }
    if (property.maximum != null) {
      parts.push(`max ${property.maximum}`);
    }
  }
  if (property.enum && property.enum.length > 0) {
    parts.push(property.enum.map(String).join(" | "));
  }
  if (property.default !== undefined) {
    parts.push(`default ${String(property.default)}`);
  }
  return parts.length > 0 ? parts.join(", ") : undefined;
}
