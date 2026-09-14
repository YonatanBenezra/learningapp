-- Assessment sittings reuse the contest engine with kind=assessment + seasonKey.

CREATE TYPE "public"."ContestKind" AS ENUM ('contest', 'assessment');

ALTER TABLE "public"."contests"
  ADD COLUMN "kind" "public"."ContestKind" NOT NULL DEFAULT 'contest',
  ADD COLUMN "seasonKey" TEXT;

CREATE INDEX "contests_kind_seasonKey_idx" ON "public"."contests"("kind", "seasonKey");
