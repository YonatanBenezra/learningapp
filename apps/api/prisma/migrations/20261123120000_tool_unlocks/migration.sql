-- CreateTable
CREATE TABLE "public"."tool_unlocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "toolId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'bought',
    "points" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tool_unlocks_userId_toolId_key" ON "public"."tool_unlocks"("userId", "toolId");

-- AddForeignKey
ALTER TABLE "public"."tool_unlocks" ADD CONSTRAINT "tool_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

