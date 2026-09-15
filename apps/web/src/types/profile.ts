import type { SkillScore } from "./progress";

export type ProfileSettings = {
  slug: string | null;
  public: boolean;
  canPublish: boolean;
  published: boolean;
  urlPath: string | null;
};

export type PublicSolve = {
  slug: string;
  title: string;
  passedAt: string;
};

export type PublicVerifiedResult = {
  id: string;
  assessmentSlug: string;
  band: string;
  bandLabel: string;
  issuedAt: string;
  totalScore: number;
  maxScore: number;
  timeBoxMinutes: number;
  skills: { slug: string; name: string; score: number }[];
};

export type PublicProfile = {
  slug: string;
  displayName: string;
  solves: number;
  attempts: number;
  rating: number;
  contestRating: number | null;
  practiceRating: number;
  streak: { current: number; longest: number };
  verifiedResults: PublicVerifiedResult[];
  skills: SkillScore[];
  recent: PublicSolve[];
};

export type OwnedSignedResult = {
  id: string;
  assessmentSlug: string;
  bandLabel: string;
  issuedAt: string;
  shared: boolean;
  revoked: boolean;
};
