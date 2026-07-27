/** Authenticated learner routes (app shell). */
export function myCoursesPath(): string {
  return '/my-courses';
}

export function learnerCoursePath(courseId: string): string {
  return `/my-courses/${courseId}`;
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
