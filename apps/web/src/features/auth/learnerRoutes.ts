/** Authenticated learner routes (app shell). */
export function myCoursesPath(): string {
  return '/my-courses';
}

export function learnerCoursePath(courseId: string): string {
  return `/my-courses/${courseId}`;
}

export function learnerLessonPath(courseId: string, lessonId: string): string {
  return `${learnerCoursePath(courseId)}?lesson=${encodeURIComponent(lessonId)}`;
}

export function lessonPlayerBackHref({
  lessonId,
  courseId,
  canEditContent,
  instructorCourseId,
}: {
  lessonId: string;
  courseId?: string | null;
  canEditContent?: boolean;
  instructorCourseId?: string | null;
}): string {
  if (canEditContent && instructorCourseId) return `/lesson/${lessonId}`;
  if (courseId) return learnerLessonPath(courseId, lessonId);
  return `/lesson/${lessonId}`;
}

export function learnerCourseStructurePath(courseId: string): string {
  return `/courses/${courseId}/structure`;
}

export function createCoursePath(): string {
  return '/create-course';
}

/** Public marketplace routes (marketing shell). */
export function marketplaceCatalogPath(): string {
  return '/courses';
}

export function marketplaceCoursePath(courseId: string): string {
  return `/courses/${courseId}`;
}
