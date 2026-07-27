import { apiClient } from '@/src/infrastructure/apiClient';
import type {
  CreateInstructorCourseInput,
  InstructorCourse,
  InstructorDashboard,
  InstructorSale,
  UpdateInstructorCourseInput,
} from '@/src/domain/instructor';

export function getInstructorDashboard(): Promise<InstructorDashboard> {
  return apiClient<InstructorDashboard>('/instructor/dashboard');
}

export function listInstructorCourses(): Promise<{ courses: InstructorCourse[] }> {
  return apiClient<{ courses: InstructorCourse[] }>('/instructor/courses');
}

export function getInstructorCourse(id: string): Promise<{ course: InstructorCourse }> {
  return apiClient<{ course: InstructorCourse }>(`/instructor/courses/${id}`);
}

export function createInstructorCourse(
  input: CreateInstructorCourseInput,
): Promise<{ course: InstructorCourse }> {
  return apiClient<{ course: InstructorCourse }>('/instructor/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateInstructorCourse(
  id: string,
  input: UpdateInstructorCourseInput,
): Promise<{ course: InstructorCourse }> {
  return apiClient<{ course: InstructorCourse }>(`/instructor/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function publishInstructorCourse(id: string): Promise<{ course: InstructorCourse }> {
  return apiClient<{ course: InstructorCourse }>(`/instructor/courses/${id}/publish`, {
    method: 'POST',
  });
}

export function unpublishInstructorCourse(id: string): Promise<{ course: InstructorCourse }> {
  return apiClient<{ course: InstructorCourse }>(`/instructor/courses/${id}/unpublish`, {
    method: 'POST',
  });
}

export function deleteInstructorCourse(id: string): Promise<{ deleted: true }> {
  return apiClient<{ deleted: true }>(`/instructor/courses/${id}`, {
    method: 'DELETE',
  });
}

export function listInstructorSales(): Promise<{ sales: InstructorSale[] }> {
  return apiClient<{ sales: InstructorSale[] }>('/instructor/sales');
}

export function updateInstructorModuleTitle(
  courseId: string,
  moduleId: string,
  title: string,
): Promise<{ module: { id: string; title: string } }> {
  return apiClient<{ module: { id: string; title: string } }>(
    `/instructor/courses/${courseId}/modules/${moduleId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    },
  );
}

export function deleteInstructorModule(
  courseId: string,
  moduleId: string,
): Promise<{ deleted: true }> {
  return apiClient<{ deleted: true }>(`/instructor/courses/${courseId}/modules/${moduleId}`, {
    method: 'DELETE',
  });
}

export function updateInstructorLessonTitle(
  courseId: string,
  lessonId: string,
  title: string,
): Promise<{ lesson: { id: string; title: string } }> {
  return apiClient<{ lesson: { id: string; title: string } }>(
    `/instructor/courses/${courseId}/lessons/${lessonId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    },
  );
}

export function updateInstructorLessonContent(
  courseId: string,
  lessonId: string,
  input: {
    title?: string;
    content: {
      summary?: string;
      sections: Array<{ title: string; body: string }>;
      keyPoints: string[];
    };
  },
): Promise<{ lesson: { id: string; title: string; content: unknown } }> {
  return apiClient<{ lesson: { id: string; title: string; content: unknown } }>(
    `/instructor/courses/${courseId}/lessons/${lessonId}/content`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export function deleteInstructorLesson(
  courseId: string,
  lessonId: string,
): Promise<{ deleted: true }> {
  return apiClient<{ deleted: true }>(`/instructor/courses/${courseId}/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}

export function reorderInstructorStructure(
  courseId: string,
  input: { moduleOrder: string[]; lessonsByModule: Record<string, string[]> },
): Promise<{ reordered: true }> {
  return apiClient<{ reordered: true }>(`/instructor/courses/${courseId}/structure/order`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
