CREATE TABLE "public"."signed_assessment_results" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "contestEntryId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "assessmentSlug" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "signature" TEXT NOT NULL,
  "keyId" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "revokeReasonCode" TEXT,

  CONSTRAINT "signed_assessment_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "signed_assessment_results_contestEntryId_key"
  ON "public"."signed_assessment_results"("contestEntryId");

CREATE INDEX "signed_assessment_results_userId_idx"
  ON "public"."signed_assessment_results"("userId");

CREATE INDEX "signed_assessment_results_assessmentSlug_idx"
  ON "public"."signed_assessment_results"("assessmentSlug");

ALTER TABLE "public"."signed_assessment_results"
  ADD CONSTRAINT "signed_assessment_results_contestEntryId_fkey"
  FOREIGN KEY ("contestEntryId") REFERENCES "public"."contest_entries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."signed_assessment_results"
  ADD CONSTRAINT "signed_assessment_results_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
