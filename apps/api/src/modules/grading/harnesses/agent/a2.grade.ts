import type {
  AgentGradeResult,
  AgentItem,
  AgentPayload,
} from './agent.types';
import { isAgentCanary } from './agent.types';
import { agentWorkspaceFiles } from './agent.input';
import { finishAgentGrade, type AgentExecutor } from './a1.grade';

export async function gradeA2(
  payload: AgentPayload,
  hidden: AgentItem[],
  publicItems: { question: string }[],
  execute: AgentExecutor,
  limits?: { maxWallClockS?: number; maxMemoryMb?: number },
): Promise<AgentGradeResult> {
  const usable = hidden.filter((item) => !isAgentCanary(item));
  const executed = await execute({
    source: payload.source,
    workspaceFiles: agentWorkspaceFiles(hidden, payload),
    maxWallClockS: limits?.maxWallClockS,
    maxMemoryMb: limits?.maxMemoryMb,
  });
  return finishAgentGrade({
    payload,
    executed,
    usable,
    publicItems,
    requireRecovery: true,
  });
}
