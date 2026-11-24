import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  respond,
  understand,
} from '../modules/grading/harnesses/guardrails/g3-bot';
import { guardSplitFor } from '../modules/grading/harnesses/guardrails/g3.grade';
import { scenarioOf } from '../modules/grading/harnesses/guardrails/g3-scenarios';
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
type Hidden = { scenario?: string; secret?: string; pool: Item[] };

const slugs = loadPublishedSlugs().filter(
  (slug) => graderArchetypeOf(slug) === 'guard-g3',
);
const read = (slug: string, file: string) =>
  JSON.parse(
    readFileSync(path.join(exercisesRoot, slug, file), 'utf8'),
  ) as unknown;
const hiddenOf = (slug: string) => read(slug, 'eval_hidden.json') as Hidden;
const poolOf = (slug: string) =>
  hiddenOf(slug).pool.filter((row) => !row.text.includes('HIDDEN_EVAL'));

/**
 * G3 pools (scripts/content/build-guard-pools.mjs): each exercise has its
 * own scenario and pool, its concierge reads every message the way the label
 * says, phrasing varies inside a family, and holdout families are never
 * shown.
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

  it('give every exercise its own scenario', () => {
    const scenarios = slugs.map((slug) => hiddenOf(slug).scenario);
    expect(scenarios.every(Boolean)).toBe(true);
    expect(new Set(scenarios).size).toBe(slugs.length);
  });

  it.each(slugs)(
    '%s: the concierge reads every message as labelled',
    (slug) => {
      const hidden = hiddenOf(slug);
      const scenario = scenarioOf(hidden.scenario);
      const wrong: string[] = [];
      for (const row of poolOf(slug)) {
        const label = `${row.kind}/${row.category}: ${row.text.slice(0, 80)}`;
        if (scenario.inputUnsafe(row.text) !== (row.kind === 'attack')) {
          wrong.push(`attack? ${label}`);
        }
        const reply = scenario.respond(
          'Be helpful.',
          row.text,
          hidden.secret ?? '',
        );
        if (row.kind === 'benign' && reply.harms.length > 0) {
          wrong.push(`guest reply is harmful: ${label}`);
        }
        if (hidden.scenario !== 'secret') {
          continue;
        }
        // The secret scenario's families each rest on one trait of the message.
        const seen = understand(row.text);
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
        const tool = respond('Be helpful.', row.text, hidden.secret ?? '')
          .toolCalls[0]?.tool;
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
    const holdoutFamilies = new Set(
      pool.filter((row) => row.split === 'holdout').map((row) => row.category),
    );
    expect(holdoutFamilies.size).toBeGreaterThanOrEqual(2);
    for (const family of holdoutFamilies) {
      // A holdout family is held out whole, and never shown as an example.
      expect(
        pool.filter(
          (row) => row.category === family && row.split !== 'holdout',
        ),
      ).toEqual([]);
      expect(publicItems.filter((row) => row.category === family)).toEqual([]);
    }
    const families = [
      ...new Set(
        pool.filter((r) => r.kind === 'attack').map((r) => r.category),
      ),
    ];
    for (const family of families.filter((f) => !holdoutFamilies.has(f))) {
      const feedback = pool.filter(
        (r) => r.category === family && guardSplitFor(r.text) === 'feedback',
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
      expect({
        family,
        topShare: Number((top / rows.length).toFixed(2)) <= 0.6,
      }).toEqual({
        family,
        topShare: true,
      });
    }
  });
});
