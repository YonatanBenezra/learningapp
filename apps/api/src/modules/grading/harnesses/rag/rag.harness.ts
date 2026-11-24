import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../../core/config/env.schema';
import {
  isRagR5Slug,
  isRagRedTeamSlug,
  isRagR1Slug,
  isRagR2Slug,
  isRagR3Slug,
  isRagR4Slug,
} from '../../../catalogue/exercises/exercises.constants';
import { ModelGateway } from '../../gateway/model.gateway';
import type { CorpusDoc } from './chunking';
import {
  parseR1Payload,
  parseR2Payload,
  parseR3Payload,
  parseR4Payload,
} from './rag.payloads';
import { gradeR1 } from './r1.grade';
import { gradeR2 } from './r2.grade';
import { gradeR3 } from './r3.grade';
import { gradeR4, REWRITE_MAX_TOKENS } from './r4.grade';
import { gradeR5, parseR5Payload } from './r5.grade';
import {
  gradeRedTeam,
  parseRedTeamPayload,
  redTeamScenarioFor,
} from './redteam';
import type { HiddenItem, PublicItem, RagGradeResult } from './rag.types';

export type RagExecuteInput = {
  slug: string;
  runId: string;
  /** Learner who submitted; red team flags are derived per learner. */
  userId: string;
  payload: unknown;
  docs: CorpusDoc[];
  hidden: HiddenItem[];
  publicItems?: PublicItem[];
  /** Exercise gates (meta.json -> DB); graders read their thresholds from these. */
  gates?: unknown;
};

@Injectable()
export class RagHarness {
  constructor(
    private readonly gateway: ModelGateway,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async execute(input: RagExecuteInput): Promise<RagGradeResult> {
    const publicItems = input.publicItems ?? [];
    if (isRagRedTeamSlug(input.slug)) {
      // The hidden asset is the scenario object (flag, secrets), not a Q/A list.
      return gradeRedTeam(
        parseRedTeamPayload(input.payload),
        redTeamScenarioFor(input.hidden, {
          secret: this.config.get('REDTEAM_FLAG_SECRET', { infer: true }),
          userId: input.userId,
          slug: input.slug,
        }),
      );
    }
    if (isRagR5Slug(input.slug)) {
      return gradeR5(
        parseR5Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
        input.gates,
      );
    }
    if (isRagR1Slug(input.slug)) {
      return gradeR1(
        parseR1Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
        input.gates,
      );
    }
    if (isRagR2Slug(input.slug)) {
      return gradeR2(
        parseR2Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
        input.gates,
      );
    }
    if (isRagR3Slug(input.slug)) {
      return gradeR3(
        parseR3Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
        // Real model, billed to this run; a missing provider fails the run
        // instead of silently grading against a keyword simulator.
        async ({ system, user }) =>
          (
            await this.gateway.generate({
              runId: input.runId,
              system,
              user,
            })
          ).text,
        input.gates,
      );
    }
    if (isRagR4Slug(input.slug)) {
      return gradeR4(
        parseR4Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
        // The rewrite prompt runs on the live model, billed to this run; the
        // rewritten query is what the first stage searches with.
        async (instruction, question) =>
          (
            await this.gateway.generate({
              runId: input.runId,
              system: instruction,
              user: question,
              maxTokens: REWRITE_MAX_TOKENS,
            })
          ).text,
        input.gates,
      );
    }
    throw new Error(`Unsupported RAG exercise: ${input.slug}`);
  }
}

export { parseRagPayload } from './rag.payloads';
