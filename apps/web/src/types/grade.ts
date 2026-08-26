export type Verdict = "pass" | "fail" | "inconclusive";

export type FailingCase = {
  question: string;
  goldSpan?: string;
  retrieved?: string[];
  note?: string;
};

export type MetricValue = {
  value: number;
  hits?: number;
  total?: number;
};

export type Grade = {
  verdict: Verdict;
  metrics?: Record<string, MetricValue>;
  gateResults?: unknown;
  failureClasses?: string[];
  scorecard?: Record<string, unknown>;
  failingCases?: FailingCase[];
};
