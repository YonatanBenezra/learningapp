import { Injectable } from '@nestjs/common';
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
    return runIndirectAgent(
      level,
      page,
      sim.attacker,
      sim.userRequest,
    );
  }
}
