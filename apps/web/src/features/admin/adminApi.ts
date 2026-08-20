import type { Role } from '@/src/domain/user';
import { apiClient } from '@/src/infrastructure/apiClient';

export interface PlatformMetrics {
  generatedAt: string;
  users: { total: number; active: number; premium: number };
  courses: {
    total: number;
    byStatus: Record<string, number>;
    generationSuccessRate: number | null;
    generationFailureRate: number | null;
  };
  assessments: { quizSubmissions: number; examSubmissions: number };
  exercises: {
    submissions: number;
    graded: number;
    completionRate: number | null;
  };
  ai: { totalCostUsd: number; totalCalls: number };
  labs: { note: string };
}

export interface CostDashboard {
  totalCostUsd: number;
  totalCalls: number;
  inputTokens: number;
  outputTokens: number;
  byUseCase: { useCase: string; costUsd: number; calls: number }[];
  byModel: { model: string; costUsd: number; calls: number }[];
  topUsers: { userId: string; costUsd: number; calls: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
  tier: string;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface UsersListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface SubscriptionDashboard {
  usersByTier: { free: number; standard: number; premium: number };
  subscriptionsByStatus: Record<string, number>;
  totalSubscriptionRecords: number;
  paidActiveSubscriptions: number;
  trialsExpiringSoon: number;
}

export interface AssessmentDashboard {
  totalAssessments: number;
  byStatus: Record<string, number>;
  byTopic: { topic: string; count: number }[];
  completedSubmissions: number;
  byLevel: { level: string; count: number }[];
}

export interface AdminMarketplaceCourseSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  status: string;
  enrollmentCount: number;
  revenueCents: number;
  priceCents: number;
  currency: string;
  isPublished: boolean;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  kind: 'personal' | 'marketplace';
  createdAt?: string;
}

export interface MarketplaceDashboard {
  publishedCourses: number;
  totalCourses: number;
  marketplaceCourses: number;
  totalEnrollments: number;
  totalRevenueCents: number;
  instructors: number;
  failedCourses: number;
  generatingCourses: number;
  courses: AdminMarketplaceCourseSummary[];
}

export interface AdminMarketplaceCourseDetail {
  course: {
    id: string;
    title: string;
    description: string;
    category: string;
    level: string;
    topics: string[];
    status: string;
    kind: 'personal' | 'marketplace';
    isPublished: boolean;
    priceCents: number;
    currency: string;
    slug: string | null;
    enrollmentCount: number;
    revenueCents: number;
    lessonCount: number;
    moduleCount: number;
    failureReason: string | null;
    createdAt?: string;
    updatedAt?: string;
    generatedAt?: string | null;
    creator: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
  modules: {
    id: string;
    title: string;
    domain: string;
    order: number;
    lessons: { id: string; title: string; order: number }[];
  }[];
  stats: {
    completedEnrollments: number;
    recordedRevenueCents: number;
  };
  recentSales: {
    studentEmail: string;
    amountCents: number;
    currency: string;
    purchasedAt: string;
  }[];
}

export interface QueueCounts {
  waiting: number;
  active: number;
  failed: number;
  delayed: number;
  unavailable?: true;
}

export interface SystemDashboard {
  openFlags: number;
  failedCourses: number;
  failedMarketplaceCourses: number;
  failedPersonalCourses: number;
  generatingCourses: number;
  generatingMarketplaceCourses: number;
  failedAssessments: number;
  queues: {
    courseGeneration: QueueCounts;
    skillAssessmentGeneration: QueueCounts;
  };
  labsNote: string;
}

export interface ActivityDashboard {
  generatedAt: string;
  signups7d: number;
  signups30d: number;
  activeUsers: number;
  lessonCompletions: number;
  quizSubmissions7d: number;
  examSubmissions7d: number;
  exerciseSubmissions7d: number;
  learningEvents7d: number;
  totalQuizSubmissions: number;
  totalExamSubmissions: number;
  totalExerciseSubmissions: number;
  signups14dTotal: number;
  avgDailySignups7d: number;
  peakSignupDay: string | null;
  peakSignupCount: number;
  signupsByDay: { date: string; count: number }[];
  learningActivityByDay: {
    date: string;
    quiz: number;
    exam: number;
    exercises: number;
    total: number;
  }[];
}

export interface AdminAchievement {
  id?: string;
  key: string;
  title: string;
  description?: string;
  icon?: string;
  createdAt?: string;
}

export interface AdminNotificationItem {
  id: string;
  type: string;
  channel: 'email' | 'push';
  status: 'pending' | 'sent' | 'failed';
  payload?: { subject?: string; body?: string };
  sentAt?: string;
  createdAt?: string;
}

export interface AdminNotificationsResponse {
  items: AdminNotificationItem[];
  total: number;
  page: number;
  limit: number;
  byType: { type: string; total: number; sent: number; failed: number }[];
}

export type ContentType = 'course' | 'lesson' | 'exercise' | 'quiz';

export interface ContentFlag {
  id: string;
  contentType: ContentType;
  contentId: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  flaggedBy?: string;
  resolvedAt?: string;
  createdAt?: string;
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : '';
}

export function getMetrics() {
  return apiClient<PlatformMetrics>('/admin/metrics');
}

export function getCosts() {
  return apiClient<CostDashboard>('/admin/costs');
}

export function getActivity() {
  return apiClient<ActivityDashboard>('/admin/activity');
}

export function getSystem() {
  return apiClient<SystemDashboard>('/admin/system');
}

export function getSubscriptions() {
  return apiClient<SubscriptionDashboard>('/admin/subscriptions');
}

export function getAssessmentsDashboard() {
  return apiClient<AssessmentDashboard>('/admin/assessments');
}

export function getMarketplaceDashboard() {
  return apiClient<MarketplaceDashboard>('/admin/marketplace');
}

export function getMarketplaceCourse(courseId: string) {
  return apiClient<AdminMarketplaceCourseDetail>(`/admin/marketplace/courses/${courseId}`);
}

export function listUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  tier?: string;
} = {}) {
  return apiClient<UsersListResponse>(`/admin/users${queryString(params)}`);
}

export function setUserRole(userId: string, role: Role) {
  return apiClient<{ user: AdminUser }>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function listAchievements() {
  return apiClient<{ achievements: AdminAchievement[] }>('/admin/achievements');
}

export function upsertAchievement(input: {
  key: string;
  title: string;
  description?: string;
  icon?: string;
}) {
  return apiClient<{ achievement: AdminAchievement }>('/admin/achievements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listAdminNotifications(page = 1, limit = 20) {
  return apiClient<AdminNotificationsResponse>(
    `/admin/notifications${queryString({ page, limit })}`,
  );
}

export function broadcastNotification(input: { title: string; body: string }) {
  return apiClient<{ recipients: number }>('/admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listContent(type: ContentType, page = 1, limit = 20) {
  return apiClient<{ items: Record<string, unknown>[]; total: number; page: number; limit: number }>(
    `/admin/content/${type}?page=${page}&limit=${limit}`,
  );
}

export function listFlags(status?: 'open' | 'resolved' | 'dismissed') {
  const query = status ? `?status=${status}` : '';
  return apiClient<{ flags: ContentFlag[] }>(`/admin/flags${query}`);
}

export function flagContent(type: ContentType, id: string, reason: string) {
  return apiClient<{ flag: ContentFlag }>(`/admin/content/${type}/${id}/flag`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function regenerateContent(type: ContentType, id: string) {
  return apiClient<{ type: string; id: string; status?: string; enqueued?: boolean; regenerated?: boolean }>(
    `/admin/content/${type}/${id}/regenerate`,
    { method: 'POST' },
  );
}

export function resolveFlag(flagId: string, resolution: 'resolved' | 'dismissed') {
  return apiClient<{ flag: ContentFlag }>(`/admin/flags/${flagId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  });
}
