#!/usr/bin/env node
/**
 * Unpublish test / junk profiles from the public leaderboard.
 * Safe for dev DBs cluttered by e2e runs (@labpath.test, ada-<timestamp>, lb-*).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_SLUG =
  /^(ada-\d+|lb-(shown|hidden)-\d+|test-\d+)$/i;

async function main() {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      profilePublic: true,
    },
    select: {
      id: true,
      email: true,
      profileSlug: true,
      displayName: true,
    },
  });

  const toUnpublish = users.filter((u) => {
    if (u.email.toLowerCase().endsWith('@labpath.test')) {
      return true;
    }
    if (u.profileSlug && TEST_SLUG.test(u.profileSlug)) {
      return true;
    }
    return false;
  });

  if (toUnpublish.length === 0) {
    console.log('No test leaderboard profiles to unpublish.');
    return;
  }

  const ids = toUnpublish.map((u) => u.id);
  const result = await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: { profilePublic: false },
  });

  console.log(`Unpublished ${result.count} profile(s) from the leaderboard:`);
  for (const u of toUnpublish.slice(0, 20)) {
    console.log(`  - ${u.displayName ?? u.email} (${u.profileSlug ?? 'no slug'})`);
  }
  if (toUnpublish.length > 20) {
    console.log(`  … and ${toUnpublish.length - 20} more`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
