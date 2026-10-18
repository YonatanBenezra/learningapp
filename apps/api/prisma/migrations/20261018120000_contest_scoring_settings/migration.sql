-- CreateEnum
CREATE TYPE "public"."ContestSamplingMode" AS ENUM ('per_user', 'fixed_pool');

-- AlterTable
ALTER TABLE "public"."contests"
ADD COLUMN "samplingMode" "public"."ContestSamplingMode" NOT NULL DEFAULT 'per_user',
ADD COLUMN "pointsPerProblem" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "rankingIncludesActive" BOOLEAN NOT NULL DEFAULT true;
