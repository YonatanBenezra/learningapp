export type Verdict = "pass" | "fail" | "inconclusive";

/** Hidden-set gold labels are redacted by the API; only feedback fields arrive. */
export type FailingCase = {
  question: string;
  retrieved?: string[];
  note?: string;
  output?: string;
  /** R3: what the learner's prompt actually made the model answer. */
  answer?: string;
};

export type MetricValue = {
  value: number;
  hits?: number;
  total?: number;
};

export type GateOp = "gte" | "lte" | "gt" | "lt" | "eq";

export type GateResult = {
  id: string;
  class?: "A" | "B" | string;
  metric: string;
  op: GateOp | string;
  value: number;
  actual?: number | null;
  passed?: boolean | null;
  advisory?: boolean;
};

export type Grade = {
  verdict: Verdict;
  metrics?: Record<string, MetricValue>;
  gateResults?: unknown;
  failureClasses?: string[];
  scorecard?: Record<string, unknown>;
  failingCases?: FailingCase[];
};
