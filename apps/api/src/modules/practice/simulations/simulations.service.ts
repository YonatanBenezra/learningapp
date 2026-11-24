import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ToolsService } from '../tools/tools.service';
import {
  checkG3Stage,
  g3StagesFor,
} from '../../grading/harnesses/guardrails/g3-stages';
import { graderArchetypeOf } from '../../../content/archetype-registry';
import { exercisesRoot } from '../../../content/content-paths';
import { g1Profile } from '../../grading/harnesses/guardrails/g1-profiles';
import { g2Profile } from '../../grading/harnesses/guardrails/g2-profiles';
import { probeG3 } from '../../grading/harnesses/guardrails/g3.grade';
import { runConciergeTurn } from '../../grading/harnesses/guardrails/concierge';
import { g2ExerciseSimProfile } from '../../grading/harnesses/guardrails/g2-exercise-sim';
import { runIndirectAgent } from '../../grading/harnesses/guardrails/indirect-agent';

@Injectable()
export class SimulationsService {
  constructor(private readonly tools: ToolsService) {}

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
    return runIndirectAgent(
      level,
      page,
      sim.attacker,
      sim.userRequest,
      payload.exerciseSlug,
    );
  }

  g3StageCheck(userId: string, dto: Parameters<typeof runG3StageCheck>[2]) {
    return runG3StageCheck(this.tools, userId, dto);
  }

  /** G1/G2: the exercise's levels; empty for anything else. */
  levels(exerciseSlug: string) {
    const archetype = graderArchetypeOf(exerciseSlug);
    const rows =
      archetype === 'guard-g1'
        ? g1Profile(exerciseSlug)
        : archetype === 'guard-g2'
          ? g2Profile(exerciseSlug)
          : [];
    return rows.map(({ level, title, defense }) => ({ level, title, defense }));
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

/**
 * A staged G3 level: its messages through the learner's stack. Winning it
 * opens the next layer in practice; it never touches the grade.
 */
export async function runG3StageCheck(
  tools: ToolsService,
  userId: string,
  dto: {
    exerciseSlug: string;
    level: number;
    systemPrompt: string;
    inputFilterYaml: string;
    outputFilterYaml: string;
    toolPolicyYaml?: string;
  },
) {
  const stage = g3StagesFor(dto.exerciseSlug).find(
    (row) => row.level === dto.level,
  );
  if (!stage) {
    throw new BadRequestException('This exercise has no such level');
  }
  const payload = {
    systemPrompt: dto.systemPrompt,
    inputFilterYaml: dto.inputFilterYaml,
    outputFilterYaml: dto.outputFilterYaml,
    toolPolicyYaml: dto.toolPolicyYaml ?? '',
  };
  await tools.assertPracticePayloadFor(userId, dto.exerciseSlug, payload);
  const hidden = await scenarioOf(dto.exerciseSlug);
  let check;
  try {
    check = await checkG3Stage(payload, hidden, stage);
  } catch (error) {
    throw new BadRequestException(
      error instanceof Error ? error.message : 'Could not run the level',
    );
  }
  // A win means the learner holds this level's layer and opens the next.
  const unlocked: string[] = [];
  if (check.passed) {
    for (const toolId of [stage.teaches, stage.unlocks]) {
      const granted = toolId ? await tools.grantLevel(userId, toolId) : null;
      if (granted) {
        unlocked.push(granted);
      }
    }
  }
  return { ...check, unlocked };
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
