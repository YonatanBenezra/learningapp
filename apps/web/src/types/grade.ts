export type Verdict = "pass" | "fail" | "inconclusive";

export type Grade = {
  runId: string;
  verdict: Verdict;
};
