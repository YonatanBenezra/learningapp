-- CreateEnum
CREATE TYPE "public"."ContestEntryStatus" AS ENUM ('active', 'finished', 'expired');

-- CreateTable
CREATE TABLE "public"."contests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timeBoxMinutes" INTEGER NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contest_problems" (
    "contestId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "exerciseSlug" TEXT NOT NULL,

    CONSTRAINT "contest_problems_pkey" PRIMARY KEY ("contestId","position")
);

-- CreateTable
CREATE TABLE "public"."contest_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contestId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sampleSeed" TEXT NOT NULL,
    "sampledSlugs" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "elapsedMs" INTEGER,
    "status" "public"."ContestEntryStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "contest_entries_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."attempts" ADD COLUMN "contestEntryId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "contests_slug_key" ON "public"."contests"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "contest_problems_contestId_exerciseSlug_key" ON "public"."contest_problems"("contestId", "exerciseSlug");

-- CreateIndex
CREATE INDEX "contest_problems_exerciseSlug_idx" ON "public"."contest_problems"("exerciseSlug");

-- CreateIndex
CREATE UNIQUE INDEX "contest_entries_contestId_userId_key" ON "public"."contest_entries"("contestId", "userId");

-- CreateIndex
CREATE INDEX "contest_entries_contestId_status_idx" ON "public"."contest_entries"("contestId", "status");

-- CreateIndex
CREATE INDEX "attempts_contestEntryId_idx" ON "public"."attempts"("contestEntryId");

-- AddForeignKey
ALTER TABLE "public"."contest_problems" ADD CONSTRAINT "contest_problems_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "public"."contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contest_entries" ADD CONSTRAINT "contest_entries_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "public"."contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contest_entries" ADD CONSTRAINT "contest_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attempts" ADD CONSTRAINT "attempts_contestEntryId_fkey" FOREIGN KEY ("contestEntryId") REFERENCES "public"."contest_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
