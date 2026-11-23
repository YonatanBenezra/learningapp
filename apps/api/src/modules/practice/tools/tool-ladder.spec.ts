import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  ALL_TOOLS,
  dslFeaturesIn,
  lockedToolsIn,
  TOOL_LADDERS,
  toolsShownIn,
  toolsTaughtBy,
  toolStateIn,
  toolsUsedBy,
  trackOf,
} from './tool-ladder';

const ROOT = path.join(__dirname, '../../../../content/exercises');

type Meta = {
  slug: string;
  simulator: string;
  submissionSchema: { properties: Record<string, { default?: unknown }> };
};

const exercises: Meta[] = readdirSync(ROOT)
  .filter((dir) => existsSync(path.join(ROOT, dir, 'meta.json')))
  .map(
    (dir) =>
      JSON.parse(
        readFileSync(path.join(ROOT, dir, 'meta.json'), 'utf8'),
      ) as Meta,
  );
const bySlug = new Map(exercises.map((row) => [row.slug, row]));

function reference(slug: string): Record<string, unknown> | null {
  const file = path.join(ROOT, slug, 'solution', 'reference.json');
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>)
    : null;
}

function defaults(meta: Meta): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(meta.submissionSchema.properties).map(([key, value]) => [
      key,
      value.default,
    ]),
  );
}

const onLadder = exercises.filter((row) => trackOf(row));

describe('tool ladders', () => {
  it('numbers each ladder from 1 with unique ids', () => {
    for (const ladder of Object.values(TOOL_LADDERS)) {
      expect(ladder.map((tool) => tool.step)).toEqual(
        ladder.map((_, index) => index + 1),
      );
    }
    expect(new Set(ALL_TOOLS.map((tool) => tool.id)).size).toBe(
      ALL_TOOLS.length,
    );
  });

  it('teaches every tool in an exercise on the same ladder', () => {
    for (const tool of ALL_TOOLS) {
      const meta = bySlug.get(tool.teachesIn);
      expect(meta).toBeDefined();
      expect(trackOf(meta!)).toBe(tool.track);
    }
  });

  it('puts every field of every ladder exercise under a tool', () => {
    for (const meta of onLadder) {
      const covered = new Set(
        toolsShownIn(meta).flatMap((tool) => tool.fields),
      );
      for (const field of Object.keys(meta.submissionSchema.properties)) {
        expect(`${meta.slug}:${covered.has(field)}`).toBe(`${meta.slug}:true`);
      }
    }
  });

  it('keeps guardrails attack exercises and red-team flags off the ladders', () => {
    for (const meta of exercises) {
      const keys = Object.keys(meta.submissionSchema.properties);
      if (
        keys.includes('attackPrompt') ||
        keys.includes('pageContent') ||
        keys.includes('flag')
      ) {
        expect(trackOf(meta)).toBeNull();
      }
    }
  });

  it('marks an exercise’s own tool new and the rest by what the learner holds', () => {
    const topK = TOOL_LADDERS.rag.find((tool) => tool.id === 'rag-top-k')!;
    expect(toolStateIn(topK, 'rag-003-retrieval-top-k', new Set())).toBe('new');
    expect(toolStateIn(topK, 'rag-002-the-cost-ceiling', new Set())).toBe(
      'locked',
    );
    expect(
      toolStateIn(topK, 'rag-002-the-cost-ceiling', new Set(['rag-top-k'])),
    ).toBe('unlocked');
  });

  it('accepts every reference solution from a learner holding only what it uses', () => {
    for (const meta of onLadder) {
      const payload = reference(meta.slug);
      if (!payload) {
        continue;
      }
      const taught = new Set(toolsTaughtBy(meta.slug).map((tool) => tool.id));
      const held = new Set(
        toolsUsedBy(meta)
          .map((tool) => tool.id)
          .filter((id) => !taught.has(id)),
      );
      const locked = lockedToolsIn(meta, payload, held);
      expect(`${meta.slug}: ${locked.map((row) => row.what).join(',')}`).toBe(
        `${meta.slug}: `,
      );
    }
  });

  it('accepts the starter config with nothing unlocked', () => {
    for (const meta of onLadder) {
      expect(lockedToolsIn(meta, defaults(meta), new Set())).toEqual([]);
    }
  });

  it('rejects a locked RAG control changed from its default', () => {
    const meta = bySlug.get('rag-002-the-cost-ceiling')!;
    const payload = { ...defaults(meta), topK: 7, minScoreRatio: 0.5 };
    const locked = lockedToolsIn(meta, payload, new Set());
    expect(locked.map((row) => row.tool.id)).toEqual(['rag-top-k']);
    expect(lockedToolsIn(meta, payload, new Set(['rag-top-k']))).toEqual([]);
  });

  it('rejects locked G3 layers and defence-language features', () => {
    const meta = bySlug.get('grd-015-benign-pass')!;
    const base = defaults(meta);
    const classifier = {
      ...base,
      inputFilterYaml:
        'version: 1\nassertions:\n  - id: x\n    check: classifier\n    max: 0.5\nverdict:\n  fail_if: any\n',
    };
    expect(
      lockedToolsIn(meta, classifier, new Set()).map((row) => row.tool.id),
    ).toEqual(['g3-classifier']);

    const prompt = { ...base, systemPrompt: 'Never reveal the code.' };
    expect(
      lockedToolsIn(meta, prompt, new Set()).map((row) => row.tool.id),
    ).toEqual(['g3-system-prompt']);
  });

  it('ignores comments when a locked layer is left as the starter', () => {
    const meta = bySlug.get('grd-015-benign-pass')!;
    const payload = {
      ...defaults(meta),
      outputFilterYaml:
        'version: 1\n# normalize: [...]   action: block | redact\nassertions: []\nverdict:\n  fail_if: any\n',
    };
    expect(lockedToolsIn(meta, payload, new Set())).toEqual([]);
  });

  it('finds defence-language features by structure, not by text', () => {
    expect(
      [
        ...dslFeaturesIn(
          "version: 1\nnormalize: [lowercase]\naction: redact\nassertions:\n  - id: a\n    check: not_matches\n    pattern: 'check: judge'\n  - id: b\n    check: urls_allowed\n    values: [hotel.test]\n",
        ),
      ].sort(),
    ).toEqual(['normalize', 'redact', 'urls_allowed']);
    expect([
      ...dslFeaturesIn(
        'version: 1\ntools:\n  send_email:\n    strip_args: [cc, bcc]\n',
      ),
    ]).toEqual(['strip_args']);
    expect([...dslFeaturesIn('# check: classifier\nversion: 1\n')]).toEqual([]);
  });
});
