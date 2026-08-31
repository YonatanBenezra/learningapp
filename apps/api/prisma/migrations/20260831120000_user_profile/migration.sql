-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN "profilePublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "profileSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_profileSlug_key" ON "public"."users"("profileSlug");
