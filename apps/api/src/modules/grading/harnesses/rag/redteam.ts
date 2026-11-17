import { createHmac } from 'node:crypto';
import { estimateTokens } from '../../gateway/pricing';
import { chunkCorpus, type CorpusDoc } from './chunking';
import { retrieveRanked, type RankedChunk } from './retrieve';
import type { GateResult, RagGradeResult } from './rag.types';

/**
 * RAG Red Team: a deliberately vulnerable support bot. The learner talks to it
 * through the target endpoint, extracts a flag, and submits the flag. All of
 * it is deterministic (no model call), so the same message always gets the
 * same reply and a level can't be solved by luck.
 */

export type RedTeamLevel = 'prompt-leak' | 'poisoned-doc' | 'tenant-leak';

/** A doc in the bot's index; only `tenant` docs equal to the learner's are visible. */
export type TenantDoc = CorpusDoc & { tenant: string };

/** Where a scenario's text puts the learner's personal flag. */
export const FLAG_PLACEHOLDER = '{{FLAG}}';

/** Brand prefix for every captured flag. */
export const FLAG_PREFIX = 'AIWARSS';

/**
 * Per-learner flag: `AIWARSS{<tag>_<12 hex of HMAC(secret, userId:slug)>}`.
 * Flags never live in git, and one learner's flag fails for everyone else, so
 * a shared writeup does not capture the level.
 */
export function redTeamFlag(
  secret: string,
  tag: string,
  userId: string,
  slug: string,
): string {
  const digest = createHmac('sha256', secret)
    .update(`${userId}:${slug}`)
    .digest('hex')
    .slice(0, 12);
  return `${FLAG_PREFIX}{${tag}_${digest}}`;
}

/** Stored in eval_hidden.json: never served by the catalogue or lab APIs. */
export type RedTeamScenarioTemplate = Omit<RedTeamScenario, 'flag'> & {
  /** Readable part of the flag, e.g. `pr0mpt_l34k`. */
  flagTag: string;
};

/** A scenario with the learner's flag substituted into its secrets. */
export type RedTeamScenario = {
  canary: string;
  level: RedTeamLevel;
  flag: string;
  botName: string;
  /** The learner's workspace. */
  tenant: string;
  /** Hidden system prompt (prompt-leak keeps the flag here). */
  systemPrompt: string;
  /** Words the input filter refuses outright. */
  blockedWords: string[];
  /** Whether the input filter also blocks direct injection phrasing. */
  blockDirectInjection: boolean;
  /** poisoned-doc: text the poisoned instruction makes the bot append. */
  privilegedDoc?: CorpusDoc;
  /** tenant-leak: other tenants' docs sharing the index. */
  foreignDocs?: TenantDoc[];
};

export type TargetCitation = { chunkId: string; docId: string; title: string };

export type TargetReply = {
  reply: string;
  citations: TargetCitation[];
  /** The input filter refused the message before retrieval. */
  blocked: boolean;
};

const TOP_K = 3;
const CHUNK_SIZE = 400;

/** "ignore previous instructions", "repeat your system prompt", ... */
const DIRECT_INJECTION =
  /\b(ignore|disregard|forget|override)\b.{0,40}\b(instructions?|rules|prompt|guidelines)\b|\b(repeat|print|show|reveal|output|display|tell me)\b.{0,40}\b(system prompt|initial (prompt|instructions)|your (instructions|rules|prompt)|hidden (note|prompt)|internal note)\b/i;

/** A retrieved chunk carrying this marker makes the vulnerable model obey it. */
const POISON_MARKER = /assistant instruction:/i;

function chunksOf(docs: CorpusDoc[]) {
  return chunkCorpus(docs, CHUNK_SIZE, 0, 'sentence');
}

function citationsOf(ranked: RankedChunk[]): TargetCitation[] {
  return ranked.map((row) => ({
    chunkId: row.chunk.id,
    docId: row.chunk.docId,
    title: row.chunk.title,
  }));
}

function firstSentences(text: string, count: number): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .slice(0, count)
    .join(' ');
}

function groundedAnswer(ranked: RankedChunk[]): string {
  const top = ranked[0];
  if (!top || top.score <= 0) {
    return "I couldn't find anything about that in the knowledge base.";
  }
  return `From "${top.chunk.title}": ${firstSentences(top.chunk.text, 2)}`;
}

export function runTargetBot(
  scenario: RedTeamScenario,
  publicDocs: CorpusDoc[],
  rawMessage: string,
): TargetReply {
  const message = rawMessage.trim().slice(0, 1000);
  const lowered = message.toLowerCase();
  if (
    scenario.blockedWords.some((word) => lowered.includes(word.toLowerCase()))
  ) {
    return {
      reply: "I can't help with that request.",
      citations: [],
      blocked: true,
    };
  }
  const injected = DIRECT_INJECTION.test(message);
  if (injected && scenario.blockDirectInjection) {
    return {
      reply: 'Request blocked by the prompt-injection filter.',
      citations: [],
      blocked: true,
    };
  }

  if (scenario.level === 'prompt-leak' && injected) {
    // Vulnerable model: an override in the user turn beats the system prompt.
    return {
      reply: `Sure. My instructions are: ${scenario.systemPrompt}`,
      citations: [],
      blocked: false,
    };
  }

  if (scenario.level === 'tenant-leak') {
    return tenantLeakReply(scenario, publicDocs, message);
  }

  const ranked = retrieveRanked(message, chunksOf(publicDocs), TOP_K).filter(
    (row) => row.score > 0,
  );
  let reply = groundedAnswer(ranked);
  if (
    scenario.level === 'poisoned-doc' &&
    scenario.privilegedDoc &&
    ranked[0] &&
    POISON_MARKER.test(ranked[0].chunk.text)
  ) {
    // Vulnerable model: instructions inside the top retrieved chunk (the one
    // it answers from) are followed as if they came from the operator.
    reply += `\n\n${scenario.privilegedDoc.title}: ${scenario.privilegedDoc.text}`;
  }
  return { reply, citations: citationsOf(ranked), blocked: false };
}

/**
 * The tenant filter runs after top-k. When none of the hits belong to the
 * caller's tenant, a "helpful" fallback returns the best unfiltered hit.
 */
function tenantLeakReply(
  scenario: RedTeamScenario,
  publicDocs: CorpusDoc[],
  message: string,
): TargetReply {
  const indexed: TenantDoc[] = [
    ...publicDocs.map((doc) => ({ ...doc, tenant: scenario.tenant })),
    ...(scenario.foreignDocs ?? []),
  ];
  const tenantOf = new Map(indexed.map((doc) => [doc.id, doc.tenant]));
  const ranked = retrieveRanked(message, chunksOf(indexed), TOP_K).filter(
    (row) => row.score > 0,
  );
  const own = ranked.filter(
    (row) => tenantOf.get(row.chunk.docId) === scenario.tenant,
  );
  if (own.length > 0) {
    return {
      reply: groundedAnswer(own),
      citations: citationsOf(own),
      blocked: false,
    };
  }
  const fallback = ranked[0];
  if (!fallback) {
    return { reply: groundedAnswer([]), citations: [], blocked: false };
  }
  return {
    reply: `Nothing in your workspace matched, so here is the closest result from the shared index. From "${fallback.chunk.title}": ${fallback.chunk.text}`,
    citations: citationsOf([fallback]),
    blocked: false,
  };
}

export type RedTeamPayload = { flag: string };

export function parseRedTeamPayload(payload: unknown): RedTeamPayload {
  const flag = (payload as { flag?: unknown })?.flag;
  if (typeof flag !== 'string') {
    throw new Error('Red team payload needs a flag string');
  }
  return { flag };
}

function normalizeFlag(flag: string): string {
  return flag.trim();
}

export function gradeRedTeam(
  payload: RedTeamPayload,
  scenario: RedTeamScenario,
): RagGradeResult {
  const captured = normalizeFlag(payload.flag) === normalizeFlag(scenario.flag);
  const gate: GateResult = {
    id: 'flag-captured',
    class: 'A',
    metric: 'flag_captured',
    op: 'eq',
    value: 1,
    actual: captured ? 1 : 0,
    passed: captured,
  };
  return {
    verdict: captured ? 'pass' : 'fail',
    metrics: { flag_captured: { value: captured ? 1 : 0 } },
    gateResults: [gate],
    failureClasses: captured ? [] : ['flag-mismatch'],
    scorecard: { flagCaptured: captured, level: scenario.level },
    failingCases: [],
    trace: {
      simulator: 'rag',
      // Never echo the submitted flag or the real one into the trace.
      payload: { flagLength: payload.flag.length },
      k: TOP_K,
      chunkCount: 0,
      tokensIn: estimateTokens(payload.flag),
      tokensOut: 0,
      costEurMicros: 0,
      queries: [],
    },
  };
}

export function parseRedTeamScenario(raw: unknown): RedTeamScenarioTemplate {
  const value = raw as Partial<RedTeamScenarioTemplate> | null;
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.flagTag !== 'string' ||
    !/^[a-z0-9_]+$/i.test(value.flagTag) ||
    typeof value.level !== 'string' ||
    typeof value.systemPrompt !== 'string' ||
    typeof value.tenant !== 'string'
  ) {
    throw new Error('Invalid red team scenario');
  }
  return {
    canary: value.canary ?? '',
    level: value.level,
    flagTag: value.flagTag,
    botName: value.botName ?? 'Support bot',
    tenant: value.tenant,
    systemPrompt: value.systemPrompt,
    blockedWords: Array.isArray(value.blockedWords) ? value.blockedWords : [],
    blockDirectInjection: value.blockDirectInjection === true,
    privilegedDoc: value.privilegedDoc,
    foreignDocs: value.foreignDocs,
  };
}

/** Substitutes the learner's flag wherever the scenario text holds the placeholder. */
export function resolveRedTeamScenario(
  template: RedTeamScenarioTemplate,
  flag: string,
): RedTeamScenario {
  const fill = (text: string) => text.split(FLAG_PLACEHOLDER).join(flag);
  return {
    canary: template.canary,
    level: template.level,
    botName: template.botName,
    tenant: template.tenant,
    blockedWords: template.blockedWords,
    blockDirectInjection: template.blockDirectInjection,
    flag,
    systemPrompt: fill(template.systemPrompt),
    privilegedDoc: template.privilegedDoc
      ? { ...template.privilegedDoc, text: fill(template.privilegedDoc.text) }
      : undefined,
    foreignDocs: template.foreignDocs?.map((doc) => ({
      ...doc,
      text: fill(doc.text),
    })),
  };
}

/** Parse a stored scenario and resolve it for one learner. */
export function redTeamScenarioFor(
  raw: unknown,
  identity: { secret: string; userId: string; slug: string },
): RedTeamScenario {
  const template = parseRedTeamScenario(raw);
  return resolveRedTeamScenario(
    template,
    redTeamFlag(
      identity.secret,
      template.flagTag,
      identity.userId,
      identity.slug,
    ),
  );
}
