import type { Role } from '../../common/types';
import { logger } from '../../common/utils/logger';
import { User } from '../users/user.model';

function parseEmailList(raw: string): string[] {
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function promoteEmails(emails: string[], role: Role): Promise<void> {
  if (emails.length === 0) return;

  for (const email of emails) {
    const existing = await User.findOne({ email }).select('role');
    if (role === 'instructor' && existing?.role === 'admin') {
      logger.info({ email }, 'Bootstrap instructor skipped — user is already admin');
      continue;
    }

    const user = await User.findOneAndUpdate({ email }, { $set: { role } }, { new: true });
    if (user) {
      logger.info({ email, role }, 'Bootstrap role applied');
    } else {
      logger.warn({ email, role }, 'Bootstrap role skipped — user not found yet');
    }
  }
}

/** Promote configured emails on boot (first admin/instructor setup without Mongo shell). */
export async function bootstrapRoles(adminEmailsRaw: string, instructorEmailsRaw: string): Promise<void> {
  await promoteEmails(parseEmailList(adminEmailsRaw), 'admin');
  await promoteEmails(parseEmailList(instructorEmailsRaw), 'instructor');
}
