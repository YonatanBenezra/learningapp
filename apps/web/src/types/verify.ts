export type VerifySignedResultStatus = "valid" | "revoked" | "invalid";

export type SignedAssessmentPayload = {
  v: 1;
  resultId: string;
  assessmentSlug: string;
  seasonKey: string | null;
  issuedAt: string;
  band: string;
  bandLabel: string;
  totalScore: number;
  maxScore: number;
  elapsedMs: number;
  timeBoxMinutes: number;
  sampleCount: number;
  sampleSeed: string;
  window: {
    startsAt: string;
    endsAt: string;
  };
  items: {
    slug: string;
    title: string;
    verdict: string;
    score: number;
  }[];
  skills: {
    slug: string;
    name: string;
    score: number;
    problems: number;
  }[];
};

export type SignedResultView = {
  id: string;
  assessmentSlug: string;
  keyId: string;
  issuedAt: string;
  revokedAt: string | null;
  revokeReasonCode: string | null;
  signatureValid: boolean;
  payload: SignedAssessmentPayload;
};

export type VerifySignedResultResponse = {
  status: VerifySignedResultStatus;
  result: SignedResultView | null;
};

export type SigningKeysResponse = {
  algorithm: "ed25519";
  keys: Record<string, string>;
};
