ALTER TABLE "public"."signed_assessment_results"
  ADD COLUMN "sharedPublicAt" TIMESTAMP(3);

CREATE INDEX "signed_assessment_results_sharedPublicAt_idx"
  ON "public"."signed_assessment_results"("sharedPublicAt");
