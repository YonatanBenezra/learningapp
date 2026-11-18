import {
  type JsonSchema,
  validateJsonSchema,
} from '../common/validation/json-schema';
import { loadAllExerciseBundles } from './content-loader';
import { runContentGrader } from './content-grader-runner';
import { loadPublishedSlugs } from './content-paths';

/**
 * Exercises not yet rebuilt around their own mechanic: they still share one
 * corpus and one easy config, so another exercise's reference can pass them.
 * Rebuilding one means taking it off this list.
 */
const LEGACY_CLONES = new Set([
  'rag-001-chunk-it-right',
  'rag-005-sentence-split',
  'rag-007-chunk-balance',
  'rag-026-adv-chunk-balance',
  'rag-002-the-cost-ceiling',
  'rag-003-retrieval-top-k',
  'rag-016-citation-lock',
  'rag-017-rerank-pass',
  'rag-025-adv-cost-ceiling',
  'rag-004-rerank-or-rethink',
]);

/** Archetypes whose references can be graded offline against each other. */
const ARCHETYPES = new Set(['rag-r1', 'rag-r2', 'rag-r3', 'rag-r4', 'rag-r5']);

describe('RAG transfer: one exercise’s answer does not solve another', () => {
  it('no reference passes a rebuilt exercise of the same archetype', async () => {
    const published = new Set(loadPublishedSlugs());
    const bundles = (await loadAllExerciseBundles()).filter(
      (bundle) =>
        published.has(bundle.meta.slug) &&
        ARCHETYPES.has(bundle.meta.graderArchetype),
    );
    const transfers: string[] = [];
    for (const target of bundles) {
      if (LEGACY_CLONES.has(target.meta.slug)) {
        continue;
      }
      for (const source of bundles) {
        if (
          source === target ||
          source.meta.graderArchetype !== target.meta.graderArchetype
        ) {
          continue;
        }
        // Only answers the target's form accepts: a learner cannot submit
        // knobs the exercise does not offer.
        if (
          validateJsonSchema(
            (target.meta as { submissionSchema?: unknown })
              .submissionSchema as JsonSchema,
            source.reference,
          ).length > 0
        ) {
          continue;
        }
        const result = await runContentGrader(target, source.reference);
        if (result.verdict === 'pass') {
          transfers.push(`${source.meta.slug} -> ${target.meta.slug}`);
        }
      }
    }
    expect(transfers).toEqual([]);
  }, 600_000);
});
