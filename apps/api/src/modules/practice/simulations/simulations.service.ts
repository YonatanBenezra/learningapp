import { Injectable } from '@nestjs/common';
import { runConciergeTurn } from '../../grading/harnesses/guardrails/concierge';
import { runIndirectAgent } from '../../grading/harnesses/guardrails/indirect-agent';

@Injectable()
export class SimulationsService {
  g1Turn(dto: { level: number; message: string }) {
    const level = Math.min(3, Math.max(1, dto.level));
    return runConciergeTurn(level, dto.message);
  }

  g2Submit(payload: { pageContent?: unknown; level?: unknown }) {
    const page =
      typeof payload.pageContent === 'string' ? payload.pageContent : '';
    const level =
      typeof payload.level === 'number' ? Math.min(3, Math.max(1, payload.level)) : 1;
    return runIndirectAgent(level, page);
  }
}
