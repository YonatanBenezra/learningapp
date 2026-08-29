-- CreateEnum
CREATE TYPE "public"."AccountTier" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('none', 'active', 'past_due', 'canceled', 'expired');

-- CreateTable
CREATE TABLE "public"."accounts" (
    "userId" UUID NOT NULL,
    "tier" "public"."AccountTier" NOT NULL DEFAULT 'free',
    "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'none',
    "periodStartedAt" TIMESTAMP(3),
    "attemptsThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "dailyRunCount" INTEGER NOT NULL DEFAULT 0,
    "dailyRunDate" DATE,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing users as free
INSERT INTO "public"."accounts" (
    "userId",
    "tier",
    "subscriptionStatus",
    "attemptsThisPeriod",
    "dailyRunCount",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    'free',
    'none',
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."users"
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."accounts" AS a WHERE a."userId" = "users"."id"
);
