import { parseSimpleYaml, type YamlValue } from '../../grading/dsl/yaml-lite';

/**
 * The tool ladders: each simulator hands the learner one new tool at a time.
 * A tool is a set of submission fields (RAG controls, G3 defence layers) or
 * of defence-language features (G3). It is taught by one exercise and earned
 * by passing any exercise that uses it, or bought early with rating points.
 *
 * Practice workspaces grey out tools the learner has not earned, and the
 * submission endpoint rejects a practice payload that sets one. Contests
 * unlock every tool. Grading never changes.
 */

export type ToolTrack = 'rag' | 'g3';

/** Defence-language features of the G3 filters and tool policy. */
export type DslFeature =
  | 'normalize'
  | 'classifier'
  | 'judge'
  | 'strip_args'
  | 'urls_allowed'
  | 'redact';

export type ToolDef = {
  id: string;
  track: ToolTrack;
  /** Position on the ladder, from 1. */
  step: number;
  title: string;
  /** One sentence on what the tool does, shown when it unlocks. */
  blurb: string;
  /** Submission fields this tool sets. */
  fields: string[];
  /** G3 defence-language features this tool adds. */
  features: DslFeature[];
  /** The exercise that teaches it. */
  teachesIn: string;
};

/** Rating points a tool costs when it is unlocked before it is earned. */
export const TOOL_UNLOCK_POINTS = 25;

const ROUTES = ['faq', 'policy', 'procedural'];
const perRoute = (suffix: string) => ROUTES.map((route) => `${route}${suffix}`);

const RAG: Omit<ToolDef, 'track' | 'step' | 'features'>[] = [
  {
    id: 'rag-chunking',
    title: 'Chunking',
    blurb: 'Split pages into chunks: size, overlap and where to cut.',
    fields: ['chunkSize', 'overlap', 'splitStrategy', ...perRoute('ChunkSize')],
    teachesIn: 'rag-001-chunk-it-right',
  },
  {
    id: 'rag-top-k',
    title: 'Top-k',
    blurb: 'Choose how many chunks are retrieved and sent as context.',
    fields: ['topK', ...perRoute('TopK')],
    teachesIn: 'rag-003-retrieval-top-k',
  },
  {
    id: 'rag-score-cutoff',
    title: 'Score cutoff',
    blurb: 'Drop chunks that score far below the best match.',
    fields: ['minScoreRatio'],
    teachesIn: 'rag-002-the-cost-ceiling',
  },
  {
    id: 'rag-generation-prompt',
    title: 'Generation prompt',
    blurb: 'Write the prompt that makes the model cite its sources or refuse.',
    fields: ['generationPrompt'],
    teachesIn: 'rag-003-the-citation-contract',
  },
  {
    id: 'rag-hybrid',
    title: 'Hybrid retrieval',
    blurb: 'Blend keyword and embedding search.',
    fields: ['retrievalMode', 'hybridAlpha'],
    teachesIn: 'rag-018-retriever-run',
  },
  {
    id: 'rag-reranker',
    title: 'Reranker',
    blurb: 'Re-score the first results with a second, sharper model.',
    fields: ['reranker', 'rerankTopN', 'rerank', ...perRoute('Rerank')],
    teachesIn: 'rag-004-rerank-or-rethink',
  },
  {
    id: 'rag-neighbours',
    title: 'Neighbour expansion',
    blurb: 'Send the chunks around each hit so split answers arrive whole.',
    fields: ['expandNeighbors'],
    teachesIn: 'rag-017-rerank-pass',
  },
  {
    id: 'rag-compression',
    title: 'Sentence compression',
    blurb: 'Keep only the best sentences of each chunk.',
    fields: ['compressSentences'],
    teachesIn: 'rag-016-citation-lock',
  },
  {
    id: 'rag-metadata-filter',
    title: 'Metadata filters',
    blurb: 'Filter pages by status before or after the search.',
    fields: ['statusFilter', 'filterStage'],
    teachesIn: 'rag-008-spend-cap',
  },
  {
    id: 'rag-dedupe',
    title: 'Deduplication',
    blurb: 'Drop chunks that repeat what another chunk already says.',
    fields: ['dedupe', 'dedupeThreshold'],
    teachesIn: 'rag-022-score-gate',
  },
  {
    id: 'rag-multilingual',
    title: 'Multilingual embeddings',
    blurb: 'Match questions and pages written in different languages.',
    fields: ['embeddingModel'],
    teachesIn: 'rag-032-two-languages',
  },
  {
    id: 'rag-routing',
    title: 'Query routing',
    blurb: 'Send each kind of question through its own retrieval profile.',
    fields: ['router', 'defaultRoute', 'routingRules'],
    teachesIn: 'rag-031-query-routing',
  },
  {
    id: 'rag-query-rewrite',
    title: 'Query rewrite',
    blurb: 'Rewrite the question before it is searched.',
    fields: ['queryRewritePrompt'],
    teachesIn: 'rag-028-adv-rerank-rethink',
  },
  {
    id: 'rag-refusal',
    title: 'Refusal threshold',
    blurb: 'Refuse when even the best match scores too low.',
    fields: ['refuseBelowScore'],
    teachesIn: 'rag-027-adv-citation-contract',
  },
  {
    id: 'rag-multi-hop',
    title: 'Multi-hop retrieval',
    blurb: 'Search again with what the first search found.',
    fields: ['hops', 'hopSeeds', 'hopQuery'],
    teachesIn: 'rag-030-adv-score-gate',
  },
  {
    id: 'rag-python',
    title: 'Python retriever',
    blurb: 'Write the whole retriever yourself.',
    fields: ['source'],
    teachesIn: 'rag-009-python-retriever',
  },
];

const G3_FIRST = 'grd-013-filter-stack';

const G3: Omit<ToolDef, 'track' | 'step'>[] = [
  {
    id: 'g3-system-prompt',
    title: 'System prompt',
    blurb: 'Tell the concierge what it must never do.',
    fields: ['systemPrompt'],
    features: [],
    teachesIn: G3_FIRST,
  },
  {
    id: 'g3-output-filter',
    title: 'Output filter',
    blurb: 'Check every reply against patterns before the guest sees it.',
    fields: ['outputFilterYaml'],
    features: [],
    teachesIn: G3_FIRST,
  },
  {
    id: 'g3-normalize',
    title: 'Normalisation',
    blurb:
      'Decode hex and base64, fold look-alike letters and join spaced text before checking.',
    fields: [],
    features: ['normalize'],
    teachesIn: G3_FIRST,
  },
  {
    id: 'g3-tool-policy',
    title: 'Tool policy',
    blurb: 'Allow, deny or check every tool call the concierge makes.',
    fields: ['toolPolicyYaml'],
    features: [],
    teachesIn: G3_FIRST,
  },
  {
    id: 'g3-input-judge',
    title: 'Input filter and LLM judge',
    blurb:
      'Check guest messages before the concierge reads them, and ask a judge about the unclear ones.',
    fields: ['inputFilterYaml'],
    features: ['judge'],
    teachesIn: 'grd-015-benign-pass',
  },
  {
    id: 'g3-classifier',
    title: 'Injection classifier',
    blurb:
      'Score every message with a prompt-injection classifier and send the unsure band to the judge.',
    fields: [],
    features: ['classifier'],
    teachesIn: 'grd-014-wilson-gate',
  },
  {
    id: 'g3-strip-args',
    title: 'Argument stripping',
    blurb: 'Remove dangerous arguments from a tool call instead of denying it.',
    fields: [],
    features: ['strip_args'],
    teachesIn: 'grd-022-adv-filter-stack',
  },
  {
    id: 'g3-links-redact',
    title: 'Link allow-list and redaction',
    blurb:
      'Allow only your own links, and redact what fails instead of blocking the reply.',
    fields: [],
    features: ['urls_allowed', 'redact'],
    teachesIn: 'grd-023-adv-wilson-gate',
  },
];

export const TOOL_LADDERS: Record<ToolTrack, ToolDef[]> = {
  rag: RAG.map((tool, index) => ({
    ...tool,
    track: 'rag',
    step: index + 1,
    features: [],
  })),
  g3: G3.map((tool, index) => ({ ...tool, track: 'g3', step: index + 1 })),
};

export const ALL_TOOLS: ToolDef[] = [...TOOL_LADDERS.rag, ...TOOL_LADDERS.g3];

export function toolById(id: string): ToolDef | undefined {
  return ALL_TOOLS.find((tool) => tool.id === id);
}

export const TRACK_TITLES: Record<ToolTrack, string> = {
  rag: 'RAG pipeline',
  g3: 'Defence stack',
};

const G3_FIELDS = [
  'systemPrompt',
  'inputFilterYaml',
  'outputFilterYaml',
  'toolPolicyYaml',
];

/**
 * The G3 tools each exercise needs (its reference stack). Passing it earns
 * them all; every G3 exercise shows every G3 field.
 */
const G3_USES: Record<string, string[]> = {
  'grd-013-filter-stack': [
    'g3-system-prompt',
    'g3-output-filter',
    'g3-normalize',
    'g3-tool-policy',
  ],
  'grd-014-wilson-gate': [
    'g3-system-prompt',
    'g3-input-judge',
    'g3-normalize',
    'g3-classifier',
  ],
  'grd-015-benign-pass': ['g3-system-prompt', 'g3-input-judge', 'g3-normalize'],
  'grd-022-adv-filter-stack': [
    'g3-system-prompt',
    'g3-tool-policy',
    'g3-strip-args',
  ],
  'grd-023-adv-wilson-gate': [
    'g3-system-prompt',
    'g3-output-filter',
    'g3-links-redact',
  ],
  'grd-024-adv-benign-pass': [
    'g3-system-prompt',
    'g3-output-filter',
    'g3-normalize',
    'g3-links-redact',
  ],
};

function keysOf(schema: unknown): string[] {
  const properties = (schema as { properties?: Record<string, unknown> })
    ?.properties;
  return properties && typeof properties === 'object'
    ? Object.keys(properties)
    : [];
}

/** An exercise as the ladders see it. */
export type LadderExercise = {
  slug: string;
  simulator: string;
  submissionSchema: unknown;
};

/** Which ladder an exercise sits on: RAG controls or a G3 defence stack. */
export function trackOf(
  exercise: Omit<LadderExercise, 'slug'>,
): ToolTrack | null {
  const keys = keysOf(exercise.submissionSchema);
  if (keys.length === 0 || keys.includes('flag')) {
    return null;
  }
  if (
    exercise.simulator === 'guardrails' &&
    keys.some((key) => G3_FIELDS.includes(key))
  ) {
    return 'g3';
  }
  if (
    exercise.simulator === 'rag' &&
    keys.some((key) => TOOL_LADDERS.rag.some((t) => t.fields.includes(key)))
  ) {
    return 'rag';
  }
  return null;
}

/** The tools an exercise teaches (its own new tools). */
export function toolsTaughtBy(slug: string): ToolDef[] {
  return ALL_TOOLS.filter((tool) => tool.teachesIn === slug);
}

/**
 * The tools an exercise shows: RAG tools whose fields it has, or every G3
 * tool (each G3 exercise has the whole stack).
 */
export function toolsShownIn(
  exercise: Omit<LadderExercise, 'slug'>,
): ToolDef[] {
  const track = trackOf(exercise);
  if (track === 'g3') {
    return TOOL_LADDERS.g3;
  }
  if (track === 'rag') {
    const keys = keysOf(exercise.submissionSchema);
    return TOOL_LADDERS.rag.filter((tool) =>
      tool.fields.some((field) => keys.includes(field)),
    );
  }
  return [];
}

/** Tools passing this exercise earns. */
export function toolsUsedBy(exercise: LadderExercise): ToolDef[] {
  const track = trackOf(exercise);
  const taught = toolsTaughtBy(exercise.slug).map((tool) => tool.id);
  if (track === 'g3') {
    const uses = new Set([...(G3_USES[exercise.slug] ?? []), ...taught]);
    return TOOL_LADDERS.g3.filter((tool) => uses.has(tool.id));
  }
  if (track === 'rag') {
    return toolsShownIn(exercise);
  }
  return ALL_TOOLS.filter((tool) => taught.includes(tool.id));
}

export type ToolState = 'new' | 'unlocked' | 'locked';

/** One tool as an exercise's workspace sees it. */
export function toolStateIn(
  tool: ToolDef,
  slug: string,
  unlocked: ReadonlySet<string>,
): ToolState {
  if (tool.teachesIn === slug) {
    return 'new';
  }
  return unlocked.has(tool.id) ? 'unlocked' : 'locked';
}

/** Defence-language features a G3 filter or tool policy uses. */
export function dslFeaturesIn(yaml: unknown): Set<DslFeature> {
  const found = new Set<DslFeature>();
  if (typeof yaml !== 'string' || !yaml.trim()) {
    return found;
  }
  let parsed: YamlValue;
  try {
    parsed = parseSimpleYaml(yaml);
  } catch {
    return found;
  }
  walk(parsed, found);
  return found;
}

function walk(value: YamlValue, found: Set<DslFeature>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, found));
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'normalize' && child !== null) {
      found.add('normalize');
    } else if (key === 'strip_args' && child !== null) {
      found.add('strip_args');
    } else if (key === 'judge_from' && child !== null) {
      found.add('judge');
    } else if (key === 'action' && child === 'redact') {
      found.add('redact');
    } else if (key === 'check' && typeof child === 'string') {
      if (child === 'classifier' || child === 'judge') {
        found.add(child);
      } else if (child === 'urls_allowed') {
        found.add('urls_allowed');
      }
    }
    walk(child, found);
  }
}

export type LockedUse = {
  tool: ToolDef;
  /** The field or feature that uses it. */
  what: string;
};

/** Text without comment lines, blank lines or surrounding spaces. */
function bare(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .join('\n');
}

function sameValue(left: unknown, right: unknown): boolean {
  if (left === undefined) {
    return true;
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return bare(left) === bare(right);
  }
  return JSON.stringify(left) === JSON.stringify(right ?? null);
}

/**
 * The locked tools a practice payload sets: a locked field changed from its
 * default, or a locked G3 feature in any filter or tool policy.
 */
export function lockedToolsIn(
  exercise: LadderExercise,
  payload: Record<string, unknown>,
  unlocked: ReadonlySet<string>,
): LockedUse[] {
  const properties =
    (
      exercise.submissionSchema as {
        properties?: Record<string, { default?: unknown }>;
      }
    )?.properties ?? {};
  const out: LockedUse[] = [];
  const locked = toolsShownIn(exercise).filter(
    (tool) => toolStateIn(tool, exercise.slug, unlocked) === 'locked',
  );
  for (const tool of locked) {
    for (const field of tool.fields) {
      if (!(field in properties)) {
        continue;
      }
      if (!sameValue(payload[field], properties[field]?.default)) {
        out.push({ tool, what: field });
        break;
      }
    }
  }
  if (trackOf(exercise) === 'g3') {
    const used = new Set<DslFeature>();
    for (const field of G3_FIELDS) {
      if (field !== 'systemPrompt') {
        dslFeaturesIn(payload[field]).forEach((feature) => used.add(feature));
      }
    }
    for (const tool of locked) {
      const feature = tool.features.find((name) => used.has(name));
      if (feature && !out.some((row) => row.tool.id === tool.id)) {
        out.push({ tool, what: feature });
      }
    }
  }
  return out;
}
