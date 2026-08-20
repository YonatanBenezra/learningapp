import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';

export { redisConnectionOptions };

// Async queues (§8). Workers are added per phase (course gen §3, grading §6).
export const QUEUE_NAMES = {
  courseGeneration: 'course-generation',
  skillAssessmentGeneration: 'skill-assessment-generation',
  grading: 'grading',
  streakReset: 'streak-reset',
  dailyReminder: 'daily-reminder',
  accountPurge: 'account-purge',
  subscriptionSync: 'subscription-sync',
} as const;

// Queues are created lazily so merely importing this module opens no Redis
// connection — only an actual enqueue (or worker) does.
const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: redisConnectionOptions() });
    queues.set(name, queue);
  }
  return queue;
}

export const courseGenerationQueue = (): Queue => getQueue(QUEUE_NAMES.courseGeneration);
export const skillAssessmentGenerationQueue = (): Queue =>
  getQueue(QUEUE_NAMES.skillAssessmentGeneration);
export const gradingQueue = (): Queue => getQueue(QUEUE_NAMES.grading);
export const streakResetQueue = (): Queue => getQueue(QUEUE_NAMES.streakReset);
export const dailyReminderQueue = (): Queue => getQueue(QUEUE_NAMES.dailyReminder);
export const accountPurgeQueue = (): Queue => getQueue(QUEUE_NAMES.accountPurge);
export const subscriptionSyncQueue = (): Queue => getQueue(QUEUE_NAMES.subscriptionSync);

// Premium jobs jump the queue (§6). In BullMQ a lower priority value is processed
// first, so premium=1 outranks free=10.
export const jobPriority = (tier?: string): number => {
  if (tier === 'premium') return 1;
  if (tier === 'standard') return 5;
  return 10;
};

export async function closeQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  queues.clear();
}
