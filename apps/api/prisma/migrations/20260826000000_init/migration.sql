-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "harness";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('learner', 'tutor', 'org_admin', 'admin');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('magic_link', 'google', 'github');

-- CreateEnum
CREATE TYPE "public"."ExerciseType" AS ENUM ('drill', 'exercise', 'lab', 'simulation', 'scenario');

-- CreateEnum
CREATE TYPE "public"."Simulator" AS ENUM ('rag', 'evaluation', 'guardrails', 'prompt_engineering', 'agent', 'benchmark', 'neural_network', 'fine_tuning');

-- CreateEnum
CREATE TYPE "public"."Difficulty" AS ENUM ('E', 'M', 'H');

-- CreateEnum
CREATE TYPE "public"."AttemptStatus" AS ENUM ('started', 'submitted', 'grading', 'graded', 'abandoned');

-- CreateEnum
CREATE TYPE "public"."RunStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'killed_budget');

-- CreateEnum
CREATE TYPE "public"."Verdict" AS ENUM ('pass', 'fail', 'inconclusive');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "role" "public"."Role" NOT NULL DEFAULT 'learner',
    "displayName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "provider" "public"."AuthProvider" NOT NULL,
    "providerUserId" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."magic_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "type" "public"."ExerciseType" NOT NULL DEFAULT 'exercise',
    "simulator" "public"."Simulator" NOT NULL,
    "title" TEXT NOT NULL,
    "briefMd" TEXT NOT NULL,
    "difficulty" "public"."Difficulty" NOT NULL,
    "submissionSchema" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "budget" JSONB NOT NULL,
    "gates" JSONB NOT NULL,
    "attemptPolicy" JSONB,
    "feedback" JSONB NOT NULL,
    "publicSample" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercise_skills" (
    "exerciseId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "exercise_skills_pkey" PRIMARY KEY ("exerciseId","skillId")
);

-- CreateTable
CREATE TABLE "public"."user_skill_scores" (
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),

    CONSTRAINT "user_skill_scores_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateTable
CREATE TABLE "public"."attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "exerciseVersion" INTEGER NOT NULL,
    "status" "public"."AttemptStatus" NOT NULL DEFAULT 'started',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hint_unlocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "hintIndex" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hint_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attemptId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submissionId" UUID NOT NULL,
    "workerVersion" TEXT NOT NULL,
    "modelVersions" JSONB NOT NULL,
    "sampleSeed" TEXT,
    "status" "public"."RunStatus" NOT NULL DEFAULT 'queued',
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costEurMicros" BIGINT NOT NULL DEFAULT 0,
    "fxRate" DECIMAL(12,6) NOT NULL,
    "cacheHitRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "runId" UUID NOT NULL,
    "verdict" "public"."Verdict" NOT NULL,
    "metrics" JSONB NOT NULL,
    "gateResults" JSONB NOT NULL,
    "failureClasses" TEXT[],
    "scorecard" JSONB NOT NULL,
    "failingCases" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."traces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "runId" UUID NOT NULL,
    "blobUri" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harness"."exercise_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exerciseSlug" TEXT NOT NULL,
    "exerciseVersion" INTEGER NOT NULL,
    "hiddenEvalUri" TEXT NOT NULL,
    "publicEvalUri" TEXT NOT NULL,
    "corpusUri" TEXT,
    "labelsUri" TEXT,
    "frozenGenUri" TEXT,
    "judgeYamlUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harness"."corpus_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corpusId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "headingPath" TEXT,
    "embedModel" TEXT NOT NULL,
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corpus_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harness"."gen_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "modelVersion" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "paramsHash" TEXT NOT NULL,
    "blobUri" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gen_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harness"."judge_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "judgeVersion" TEXT NOT NULL,
    "rubricHash" TEXT NOT NULL,
    "outputHash" TEXT NOT NULL,
    "verdict" JSONB NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judge_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harness"."label_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exerciseSlug" TEXT NOT NULL,
    "annotatorA" TEXT NOT NULL,
    "annotatorB" TEXT NOT NULL,
    "kappaHh" DOUBLE PRECISION,
    "adjudicated" BOOLEAN NOT NULL DEFAULT false,
    "labelsUri" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "label_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "identities_userId_idx" ON "public"."identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "identities_provider_providerUserId_key" ON "public"."identities"("provider", "providerUserId");

-- CreateIndex
CREATE INDEX "magic_links_tokenHash_idx" ON "public"."magic_links"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "public"."refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "public"."skills"("slug");

-- CreateIndex
CREATE INDEX "exercises_simulator_difficulty_isPublished_idx" ON "public"."exercises"("simulator", "difficulty", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_version_key" ON "public"."exercises"("slug", "version");

-- CreateIndex
CREATE INDEX "attempts_userId_exerciseId_idx" ON "public"."attempts"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "hint_unlocks_userId_exerciseId_hintIndex_key" ON "public"."hint_unlocks"("userId", "exerciseId", "hintIndex");

-- CreateIndex
CREATE INDEX "submissions_attemptId_idx" ON "public"."submissions"("attemptId");

-- CreateIndex
CREATE INDEX "submissions_payloadHash_idx" ON "public"."submissions"("payloadHash");

-- CreateIndex
CREATE INDEX "runs_submissionId_idx" ON "public"."runs"("submissionId");

-- CreateIndex
CREATE INDEX "runs_status_createdAt_idx" ON "public"."runs"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "grades_runId_key" ON "public"."grades"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "traces_runId_key" ON "public"."traces"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_assets_exerciseSlug_exerciseVersion_key" ON "harness"."exercise_assets"("exerciseSlug", "exerciseVersion");

-- CreateIndex
CREATE UNIQUE INDEX "corpus_chunks_corpusId_chunkId_embedModel_key" ON "harness"."corpus_chunks"("corpusId", "chunkId", "embedModel");

-- CreateIndex
CREATE UNIQUE INDEX "gen_cache_modelVersion_promptHash_paramsHash_key" ON "harness"."gen_cache"("modelVersion", "promptHash", "paramsHash");

-- CreateIndex
CREATE UNIQUE INDEX "judge_cache_judgeVersion_rubricHash_outputHash_key" ON "harness"."judge_cache"("judgeVersion", "rubricHash", "outputHash");

-- AddForeignKey
ALTER TABLE "public"."identities" ADD CONSTRAINT "identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magic_links" ADD CONSTRAINT "magic_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skills" ADD CONSTRAINT "skills_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_skills" ADD CONSTRAINT "exercise_skills_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_skills" ADD CONSTRAINT "exercise_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_skill_scores" ADD CONSTRAINT "user_skill_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_skill_scores" ADD CONSTRAINT "user_skill_scores_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attempts" ADD CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attempts" ADD CONSTRAINT "attempts_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hint_unlocks" ADD CONSTRAINT "hint_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hint_unlocks" ADD CONSTRAINT "hint_unlocks_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."runs" ADD CONSTRAINT "runs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grades" ADD CONSTRAINT "grades_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."traces" ADD CONSTRAINT "traces_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

