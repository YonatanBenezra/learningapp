'use client';

import type { CourseStatus } from '@/src/domain/course';

// Polling/SSE hook for async course generation (generating -> ready). See §1.3, §5.
export function useCourseGeneration(_courseId: string): { status: CourseStatus } {
  // TODO: poll GET /courses/:id until status === 'ready'
  return { status: 'generating' };
}
