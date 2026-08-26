import type {
  Difficulty,
  Exercise,
  ExerciseType,
  Simulator,
} from '@prisma/client';

export type CatalogueExercise = {
  slug: string;
  version: number;
  type: ExerciseType;
  simulator: Simulator;
  title: string;
  difficulty: Difficulty;
  skillTags: string[];
};

export type CatalogueExerciseDetail = CatalogueExercise & {
  briefMd: string;
  submissionSchema: unknown;
  thresholds: unknown;
  budget: unknown;
  gates: unknown;
  attemptPolicy: unknown;
  feedback: unknown;
  publicSample: unknown;
};

type ExerciseWithSkills = Exercise & {
  skills: { skill: { slug: string } }[];
};

function base(exercise: ExerciseWithSkills): CatalogueExercise {
  return {
    slug: exercise.slug,
    version: exercise.version,
    type: exercise.type,
    simulator: exercise.simulator,
    title: exercise.title,
    difficulty: exercise.difficulty,
    skillTags: exercise.skills.map((row) => row.skill.slug),
  };
}

export function toCatalogueListItem(
  exercise: ExerciseWithSkills,
): CatalogueExercise {
  return base(exercise);
}

export function toCatalogueDetail(
  exercise: ExerciseWithSkills,
): CatalogueExerciseDetail {
  return {
    ...base(exercise),
    briefMd: exercise.briefMd,
    submissionSchema: exercise.submissionSchema,
    thresholds: exercise.thresholds,
    budget: exercise.budget,
    gates: exercise.gates,
    attemptPolicy: exercise.attemptPolicy,
    feedback: exercise.feedback,
    publicSample: exercise.publicSample,
  };
}
