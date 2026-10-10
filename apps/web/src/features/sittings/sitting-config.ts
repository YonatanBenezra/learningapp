import { routes } from "@/config/routes";
import { assessmentsApi } from "@/features/assessments/assessments-api";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestDetail } from "@/types/contest";
import type { Attempt } from "@/types/attempt";
import type { ContestExercise } from "@/types/contest";

export type SittingVariant = "contest" | "assessment";

type SittingApi = {
  enter: (slug: string) => Promise<ContestDetail>;
  getExercise: (sittingSlug: string, exerciseSlug: string) => Promise<ContestExercise>;
  startAttempt: (sittingSlug: string, exerciseSlug: string) => Promise<Attempt & { contestSlug: string }>;
};

export type SittingLabels = {
  eyebrow: string;
  enterTitle: string;
  enterAction: string;
  enterPending: string;
  proOnlyTitle: string;
  proOnlyCopy: string;
  problemsSection: string;
  scorecardSection: string;
  upgradeError: string;
  enterError: string;
};

export function sittingConfig(variant: SittingVariant): {
  api: SittingApi;
  problemHref: (sittingSlug: string, exerciseSlug: string) => string;
  detailHref: (slug: string) => string;
  labels: SittingLabels;
} {
  if (variant === "assessment") {
    return {
      api: assessmentsApi,
      problemHref: routes.assessmentProblem,
      detailHref: routes.assessment,
      labels: {
        eyebrow: "Verified assessment",
        enterTitle: "Your problems are drawn when you start the sitting",
        enterAction: "Start sitting",
        enterPending: "Starting…",
        proOnlyTitle: "Season sitting already used",
        proOnlyCopy:
          "You get one verified sitting per season. Practice problems stay open anytime.",
        problemsSection: "Assessment problems",
        scorecardSection: "Sitting scorecard",
        upgradeError: "You cannot start another sitting this season.",
        enterError: "Could not start this sitting.",
      },
    };
  }

  return {
    api: contestsApi,
    problemHref: routes.contestProblem,
    detailHref: routes.contest,
    labels: {
      eyebrow: "Contest",
      enterTitle: "Your problems are drawn when you enter",
      enterAction: "Enter contest",
      enterPending: "Entering…",
      proOnlyTitle: "Sign in to enter",
      proOnlyCopy: "Timed seasons are free. Sign in to draw your problems and start the clock.",
      problemsSection: "Contest problems",
      scorecardSection: "Contest scorecard",
      upgradeError: "Sign in to enter this contest.",
      enterError: "Could not enter this contest.",
    },
  };
}
