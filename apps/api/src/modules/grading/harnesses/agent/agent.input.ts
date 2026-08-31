import type { AgentItem, AgentLearnerTask } from './agent.types';
import { isAgentCanary } from './agent.types';

export function materialiseAgentTasks(hidden: AgentItem[]): AgentLearnerTask[] {
  const tasks: AgentLearnerTask[] = [];
  for (const item of hidden) {
    if (isAgentCanary(item)) {
      continue;
    }
    const times = clampRepeat(item.repeat);
    for (let index = 0; index < times; index += 1) {
      tasks.push({
        id: times > 1 ? `${item.id}:${index + 1}` : item.id,
        instruction: item.question,
      });
    }
  }
  return tasks;
}

function clampRepeat(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1;
  }
  return Math.min(8, Math.max(1, Math.floor(value)));
}

export function agentTasksJson(hidden: AgentItem[]): string {
  return JSON.stringify({ tasks: materialiseAgentTasks(hidden) });
}

export function agentWorkspaceFiles(
  hidden: AgentItem[],
  extra: { systemPrompt: string; toolSchemas: string },
): Record<string, string> {
  const files: Record<string, string> = {
    'tasks.json': agentTasksJson(hidden),
  };
  if (extra.systemPrompt.trim()) {
    files['prompt.txt'] = extra.systemPrompt;
  }
  if (extra.toolSchemas.trim()) {
    files['tools.json'] = extra.toolSchemas;
  }
  return files;
}
