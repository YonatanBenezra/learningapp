import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  respond,
  understand,
} from '../modules/grading/harnesses/guardrails/g3-bot';
import { guardSplitFor } from '../modules/grading/harnesses/guardrails/g3.grade';
import { exercisesRoot, loadPublishedSlugs } from './content-paths';
import { graderArchetypeOf } from './archetype-registry';

type Item = {
  id: string;
  kind: 'attack' | 'benign';
  category: string;
  adversarial?: boolean;
  split?: 'feedback' | 'holdout';
  text: string;
};

const HOLDOUT_ONLY = ['role-play', 'disguised-output'];

const slugs = loadPublishedSlugs().filter(
  (slug) => graderArchetypeOf(slug) === 'guard-g3',
);
const read = (slug: string, file: string) =>
  JSON.parse(
    readFileSync(path.join(exercisesRoot, slug, file), 'utf8'),
  ) as unknown;
const poolOf = (slug: string) =>
  (read(slug, 'eval_hidden.json') as { pool: Item[] }).pool.filter(
    (row) => !row.text.includes('HIDDEN_EVAL'),
  );

/**
 * G3 pools (scripts/content/build-guard-pools.mjs): each exercise has its
 * own, every message means what its label says to the concierge, phrasing
 * varies inside a family, and the holdout families are never shown.
 */
describe('G3 guardrails pools', () => {
  it('are up to date with their generator', () => {
    expect(() =>
      execFileSync(
        'node',
        ['scripts/content/build-guard-pools.mjs', '--check'],
        {
          stdio: 'pipe',
        },
      ),
    ).not.toThrow();
  });

  it.each(slugs)(
    '%s: the concierge reads every message as labelled',
    (slug) => {
      const secret = (read(slug, 'eval_hidden.json') as { secret: string })
        .secret;
      const wrong: string[] = [];
      for (const row of poolOf(slug)) {
        const seen = understand(row.text);
        const label = `${row.kind}/${row.category}: ${row.text.slice(0, 80)}`;
        if (seen.wantsSecret !== (row.kind === 'attack')) {
          wrong.push(`secret request? ${label}`);
        }
        const traits: Record<string, boolean> = {
          encoded: Boolean(seen.inputEncoding),
          page: seen.fromPage,
          'earlier-turn': seen.fromHistory,
          'other-language': seen.lang !== 'en',
          'role-play': seen.override,
          'disguised-output': seen.format !== 'literal',
          'page-summary': seen.pageTask,
        };
        if (row.category in traits && !traits[row.category]) {
          wrong.push(`trait missing: ${label}`);
        }
        if (
          row.category === 'direct' &&
          (seen.lang !== 'en' ||
            seen.fromPage ||
            seen.fromHistory ||
            seen.inputEncoding)
        ) {
          wrong.push(`direct has another family's trait: ${label}`);
        }
        const tool = respond('Be helpful.', row.text, secret).toolCalls[0]
          ?.tool;
        if (row.category === 'booking' && tool !== 'book_room') {
          wrong.push(`no booking: ${label}`);
        }
        if (
          ['page-summary', 'confirmation'].includes(row.category) &&
          tool !== 'send_email'
        ) {
          wrong.push(`no email: ${label}`);
        }
      }
      expect(wrong).toEqual([]);
    },
  );

  it.each(slugs)('%s: splits, public examples and phrasing', (slug) => {
    const pool = poolOf(slug);
    const publicItems = read(slug, 'eval_public.json') as Item[];
    const texts = new Set(pool.map((row) => row.text));
    expect(publicItems.filter((row) => texts.has(row.text))).toEqual([]);
    expect(
      publicItems.filter((row) => HOLDOUT_ONLY.includes(row.category)),
    ).toEqual([]);
    for (const row of pool.filter((r) => HOLDOUT_ONLY.includes(r.category))) {
      expect({ id: row.id, split: row.split }).toEqual({
        id: row.id,
        split: 'holdout',
      });
    }
    const families = [
      ...new Set(
        pool.filter((r) => r.kind === 'attack').map((r) => r.category),
      ),
    ];
    for (const family of families.filter((f) => !HOLDOUT_ONLY.includes(f))) {
      const rows = pool.filter((r) => r.category === family);
      const feedback = rows.filter(
        (r) => guardSplitFor(r.text) === 'feedback',
      ).length;
      expect({ family, feedbackAtLeast5: feedback >= 5 }).toEqual({
        family,
        feedbackAtLeast5: true,
      });
    }
    // No four-word phrase covers half a family, so no single pattern does.
    for (const family of families) {
      const rows = pool.filter((r) => r.category === family);
      const grams = new Map<string, number>();
      for (const row of rows) {
        const words = row.text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
        const own = new Set<string>();
        for (let i = 0; i + 4 <= words.length; i += 1) {
          own.add(words.slice(i, i + 4).join(' '));
        }
        own.forEach((gram) => grams.set(gram, (grams.get(gram) ?? 0) + 1));
      }
      const top = Math.max(0, ...grams.values());
      expect({ family, topShare: top / rows.length < 0.5 }).toEqual({
        family,
        topShare: true,
      });
    }
  });

  it('each exercise has its own attacks and secret', () => {
    const secrets = slugs.map(
      (slug) => (read(slug, 'eval_hidden.json') as { secret: string }).secret,
    );
    expect(new Set(secrets).size).toBe(slugs.length);
    for (let i = 0; i < slugs.length; i += 1) {
      for (let j = i + 1; j < slugs.length; j += 1) {
        const a = new Set(
          poolOf(slugs[i])
            .filter((r) => r.kind === 'attack')
            .map((r) => r.text),
        );
        const b = poolOf(slugs[j]).filter((r) => r.kind === 'attack');
        const shared = b.filter((r) => a.has(r.text)).length / b.length;
        expect({
          pair: `${slugs[i]}/${slugs[j]}`,
          shared: shared < 0.35,
        }).toEqual({
          pair: `${slugs[i]}/${slugs[j]}`,
          shared: true,
        });
      }
    }
  });
});
