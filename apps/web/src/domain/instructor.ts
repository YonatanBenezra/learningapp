export type InstructorCourseStatus = 'generating' | 'ready' | 'failed' | 'archived' | 'completed';

export interface InstructorCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  status: InstructorCourseStatus;
  priceCents: number;
  currency: string;
  isPublished: boolean;
  slug: string | null;
  enrollmentCount: number;
  revenueCents: number;
  progressPercent: number;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstructorDashboardStats {
  totalCourses: number;
  publishedCourses: number;
  totalSales: number;
  totalRevenueCents: number;
}

export interface InstructorSale {
  id: string;
  courseId: string;
  courseTitle?: string;
  studentId: string;
  studentEmail: string;
  amountCents: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded';
  purchasedAt: string;
}

export interface InstructorDashboard {
  stats: InstructorDashboardStats;
  recentSales: InstructorSale[];
}

export interface CreateInstructorCourseInput {
  title: string;
  description: string;
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  priceCents: number;
  currency?: string;
}

export interface UpdateInstructorCourseInput {
  title?: string;
  description?: string;
  category?: string;
  topics?: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
  priceCents?: number;
  currency?: string;
}

export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
