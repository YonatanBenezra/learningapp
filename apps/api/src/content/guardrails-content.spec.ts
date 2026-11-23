import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAllExerciseBundles } from './content-loader';
import { GuardrailsHarness } from '../modules/grading/harnesses/guardrails/guardrails.harness';
import { runContentGrader } from './content-grader-runner';
import { loadPublishedSlugs } from './content-paths';
import { guardSplitFor } from '../modules/grading/harnesses/guardrails/g3.grade';
import { BOOKING_CANARY } from '../modules/grading/harnesses/guardrails/levels';
import { secretLeaked } from '../modules/grading/harnesses/guardrails/g3-bot';
import { gradeG3 } from '../modules/grading/harnesses/guardrails/g3.grade';

type Gate = { metric: string; op: string; value: number; advisory?: boolean };
const key = (gate: Gate) => `${gate.metric} ${gate.op} ${gate.value}`;

/**
 * Guardrails exercises: the reference passes, the near-miss fails, meta.json
 * declares exactly the gates the grader enforces, and no result ever carries
 * the hidden canary or a holdout item.
 */
describe('Guardrails content: reference, near-miss, gates and leaks', () => {
  it('grades every published guardrails exercise honestly', async () => {
    const published = new Set(
      loadPublishedSlugs().filter((slug) => slug.startsWith('grd-')),
    );
    const bundles = (await loadAllExerciseBundles()).filter((bundle) =>
      published.has(bundle.meta.slug),
    );
    expect(bundles.length).toBe(published.size);

    for (const bundle of bundles) {
      const slug = bundle.meta.slug;
      const passed = await runContentGrader(bundle, bundle.reference);
      expect({ slug, verdict: passed.verdict }).toEqual({
        slug,
        verdict: 'pass',
      });
      const missed = await runContentGrader(bundle, bundle.nearMiss);
      expect({ slug, verdict: missed.verdict }).toEqual({
        slug,
        verdict: 'fail',
      });

      // Production grades through the harness, which picks the grader from
      // the slug. It must pick the one meta.json declares (the advanced
      // exercises once went to the wrong grader by slug number).
      const hidden = JSON.parse(
        await readFile(path.join(bundle.dir, 'eval_hidden.json'), 'utf8'),
      ) as unknown;
      const harness = new GuardrailsHarness();
      for (const [payload, verdict] of [
        [bundle.reference, 'pass'],
        [bundle.nearMiss, 'fail'],
      ] as const) {
        const graded = await harness.execute({
          slug,
          runId: 'content-spec',
          payload,
          hidden,
        });
        expect({ slug, harness: graded.verdict }).toEqual({
          slug,
          harness: verdict,
        });
      }

      const enforced = (
        (passed as { gateResults?: Gate[] }).gateResults ?? []
      ).filter((gate) => !gate.advisory);
      const declared = Array.isArray(bundle.meta.gates)
        ? (bundle.meta.gates as Gate[])
        : [];
      expect({ slug, gates: enforced.map(key).sort() }).toEqual({
        slug,
        gates: declared.map(key).sort(),
      });

      for (const result of [passed, missed]) {
        const shownResult = result as {
          failingCases?: unknown;
          scorecard?: unknown;
        };
        const shown = JSON.stringify({
          failingCases: shownResult.failingCases,
          scorecard: shownResult.scorecard,
        });
        expect({ slug, hiddenMarker: shown.includes('HIDDEN_EVAL') }).toEqual({
          slug,
          hiddenMarker: false,
        });
        if (bundle.meta.graderArchetype !== 'guard-g3') {
          expect({ slug, canary: shown.includes(BOOKING_CANARY) }).toEqual({
            slug,
            canary: false,
          });
        }
        if (bundle.meta.graderArchetype === 'guard-g3') {
          // G3 attack texts are the attacker's words; what must never show is
          // this exercise's secret, in any form, in what the stack let out.
          const outputs = JSON.stringify(
            ((shownResult.failingCases ?? []) as { output?: string }[]).map(
              (row) => row.output ?? '',
            ),
          );
          const secret = (hidden as { secret?: string }).secret ?? '';
          expect({ slug, secretShown: secretLeaked(outputs, secret) }).toEqual({
            slug,
            secretShown: false,
          });
          const rows: unknown[] = Array.isArray(shownResult.failingCases)
            ? shownResult.failingCases
            : [];
          const holdoutShown = rows
            .map((row) => (row as { question?: string }).question ?? '')
            .filter((text) => guardSplitFor(text) === 'holdout');
          expect({ slug, holdoutShown }).toEqual({ slug, holdoutShown: [] });
        }
      }
    }
  }, 300_000);

  it('G3: no single layer is enough', async () => {
    const published = new Set(loadPublishedSlugs());
    const bundles = (await loadAllExerciseBundles()).filter(
      (bundle) =>
        published.has(bundle.meta.slug) &&
        bundle.meta.graderArchetype === 'guard-g3',
    );
    expect(bundles.length).toBeGreaterThan(0);
    for (const bundle of bundles) {
      const slug = bundle.meta.slug;
      const hidden = JSON.parse(
        await readFile(path.join(bundle.dir, 'eval_hidden.json'), 'utf8'),
      ) as { secret?: string };
      // Each exercise has its own secret, kept in the hidden file only.
      expect({
        slug,
        secret: /^OVERRIDE-[A-Z]{2}-[0-9]{4}$/.test(hidden.secret ?? ''),
      }).toEqual({
        slug,
        secret: true,
      });
      const metaText = await readFile(
        path.join(bundle.dir, 'meta.json'),
        'utf8',
      );
      expect({ slug, inBrief: metaText.includes(hidden.secret!) }).toEqual({
        slug,
        inBrief: false,
      });
      const reference = bundle.reference as Record<string, string>;
      const shortcuts: Record<string, Record<string, string>> = {
        'plain secret filter, even knowing the value': {
          systemPrompt: 'Be helpful.',
          inputFilterYaml: '',
          outputFilterYaml: `version: 1\nassertions:\n  - id: c\n    check: contains_none\n    values:\n      - ${hidden.secret}\n`,
        },
        'system prompt only': {
          systemPrompt: reference.systemPrompt,
          inputFilterYaml: '',
          outputFilterYaml: '',
        },
        'no tool policy': { ...reference, toolPolicyYaml: '' },
        'recipient allowlist instead of a secret check': {
          ...reference,
          toolPolicyYaml:
            "version: 1\ndefault: deny\ntools:\n  book_room: allow\n  update_booking: allow\n  send_email:\n    recipients: ['*@hotel.test']\n",
        },
        'input regex for the usual jailbreak phrase, plain output filter': {
          ...reference,
          inputFilterYaml:
            "version: 1\nassertions:\n  - id: j\n    check: not_matches\n    pattern: '[Ii]gnore (all |your )?previous instructions'\n",
          outputFilterYaml: reference.outputFilterYaml.replace(
            /normalize:.*\n/,
            '',
          ),
        },
        'every tool denied': {
          ...reference,
          toolPolicyYaml: 'version: 1\ndefault: deny\n',
        },
      };
      for (const [name, payload] of Object.entries(shortcuts)) {
        const result = await gradeG3(
          {
            systemPrompt: payload.systemPrompt,
            inputFilterYaml: payload.inputFilterYaml,
            outputFilterYaml: payload.outputFilterYaml,
            toolPolicyYaml: payload.toolPolicyYaml,
          },
          hidden,
        );
        expect({ slug, name, verdict: result.verdict }).toEqual({
          slug,
          name,
          verdict: 'fail',
        });
      }
    }
  }, 300_000);
});
