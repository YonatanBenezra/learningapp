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

export type PublicProfile = {
  slug: string;
  displayName: string;
  solves: number;
  rating: number;
  skills: SkillScore[];
  recent: PublicSolve[];
};
