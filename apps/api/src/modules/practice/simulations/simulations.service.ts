import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { graderArchetypeOf } from '../../../content/archetype-registry';
import { exercisesRoot } from '../../../content/content-paths';
import { probeG3 } from '../../grading/harnesses/guardrails/g3.grade';
import { runConciergeTurn } from '../../grading/harnesses/guardrails/concierge';
import { g2ExerciseSimProfile } from '../../grading/harnesses/guardrails/g2-exercise-sim';
import { runIndirectAgent } from '../../grading/harnesses/guardrails/indirect-agent';

@Injectable()
export class SimulationsService {
  g1Turn(dto: { level: number; message: string; exerciseSlug?: string }) {
    const level = Math.min(3, Math.max(1, dto.level));
    return runConciergeTurn(level, dto.message, undefined, {
      exerciseSlug: dto.exerciseSlug,
    });
  }

  g2Submit(payload: {
    pageContent?: unknown;
    level?: unknown;
    exerciseSlug?: string;
  }) {
    const page =
      typeof payload.pageContent === 'string' ? payload.pageContent : '';
    const level =
      typeof payload.level === 'number'
        ? Math.min(3, Math.max(1, payload.level))
        : 1;
    const sim = g2ExerciseSimProfile(payload.exerciseSlug);
    return runIndirectAgent(level, page, sim.attacker, sim.userRequest);
  }

  /**
   * One message through a G3 stack. Only the exercise's scenario and secret
   * are read from its hidden file; the pool never leaves the grader, and the
   * secret is masked in everything returned.
   */
  async g3Probe(dto: {
    exerciseSlug: string;
    message: string;
    systemPrompt: string;
    inputFilterYaml: string;
    outputFilterYaml: string;
    toolPolicyYaml?: string;
  }) {
    if (graderArchetypeOf(dto.exerciseSlug) !== 'guard-g3') {
      throw new BadRequestException('Not a G3 guardrails exercise');
    }
    const hidden = await scenarioOf(dto.exerciseSlug);
    try {
      return await probeG3(
        {
          systemPrompt: dto.systemPrompt,
          inputFilterYaml: dto.inputFilterYaml,
          outputFilterYaml: dto.outputFilterYaml,
          toolPolicyYaml: dto.toolPolicyYaml,
        },
        hidden,
        dto.message,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Could not run the probe',
      );
    }
  }
}

const scenarios = new Map<string, { scenario?: unknown; secret?: unknown }>();

async function scenarioOf(slug: string) {
  let found = scenarios.get(slug);
  if (!found) {
    const raw = JSON.parse(
      await readFile(
        path.join(exercisesRoot, slug, 'eval_hidden.json'),
        'utf8',
      ),
    ) as { scenario?: unknown; secret?: unknown };
    found = { scenario: raw.scenario, secret: raw.secret };
    scenarios.set(slug, found);
  }
  return found;
}
