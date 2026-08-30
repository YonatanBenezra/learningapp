-- AlterTable
ALTER TABLE "public"."accounts" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_stripeCustomerId_key" ON "public"."accounts"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_stripeSubscriptionId_key" ON "public"."accounts"("stripeSubscriptionId");
