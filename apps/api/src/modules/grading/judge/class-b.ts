import type { GateResult } from '../harnesses/rag/rag.types';

export function advisoryClassB(id: string, metric: string): GateResult {
  return {
    id,
    class: 'B',
    metric,
    op: 'gte',
    value: 0,
    actual: 0,
    passed: true,
    advisory: true,
  };
}
