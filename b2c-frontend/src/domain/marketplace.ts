export interface MarketplaceCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  priceCents: number;
  currency: string;
  slug: string | null;
  enrollmentCount: number;
  lessonCount: number;
  instructorEmail: string;
  instructorName?: string;
}

export interface MarketplaceCourseDetail extends MarketplaceCourse {
  topics: string[];
}

export interface MarketplaceCourseModule {
  id: string;
  title: string;
  domain: string;
  order: number;
  lessons: { id: string; title: string; order: number }[];
}

export interface MarketplaceCourseDetailResponse {
  course: MarketplaceCourseDetail;
  modules: MarketplaceCourseModule[];
}
