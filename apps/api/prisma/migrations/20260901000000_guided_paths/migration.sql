-- CreateTable
CREATE TABLE "public"."guided_paths" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guided_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guided_path_steps" (
    "pathId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "exerciseSlug" TEXT NOT NULL,

    CONSTRAINT "guided_path_steps_pkey" PRIMARY KEY ("pathId","position")
);

-- CreateIndex
CREATE UNIQUE INDEX "guided_paths_slug_key" ON "public"."guided_paths"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "guided_path_steps_pathId_exerciseSlug_key" ON "public"."guided_path_steps"("pathId", "exerciseSlug");

-- CreateIndex
CREATE INDEX "guided_path_steps_exerciseSlug_idx" ON "public"."guided_path_steps"("exerciseSlug");

-- AddForeignKey
ALTER TABLE "public"."guided_path_steps" ADD CONSTRAINT "guided_path_steps_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "public"."guided_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
