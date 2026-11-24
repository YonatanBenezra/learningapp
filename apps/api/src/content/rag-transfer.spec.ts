import {
  type JsonSchema,
  validateJsonSchema,
} from '../common/validation/json-schema';
import { loadAllExerciseBundles } from './content-loader';
import { runContentGrader } from './content-grader-runner';
import { loadPublishedSlugs } from './content-paths';

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
