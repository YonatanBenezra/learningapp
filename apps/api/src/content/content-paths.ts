import path from 'node:path';

export const contentRoot = path.join(process.cwd(), 'content');
export const exercisesRoot = path.join(contentRoot, 'exercises');

export type GraderArchetype =
  | 'rag-r1'
  | 'rag-r2'
  | 'rag-r3'
  | 'rag-r4'
  | 'rag-sandbox'
  | 'pe-p1'
  | 'eval-e1'
  | 'eval-e2'
  | 'eval-e3'
  | 'guard-g1'
  | 'guard-g2'
  | 'guard-g3';

export type ExerciseContentMeta = {
  slug: string;
  version: number;
  simulator: string;
  graderArchetype: GraderArchetype;
  title: string;
  difficulty: string;
  corpusFile?: string;
};
