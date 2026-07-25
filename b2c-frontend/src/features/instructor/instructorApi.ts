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

export function listInstructorSales(): Promise<{ sales: InstructorSale[] }> {
  return apiClient<{ sales: InstructorSale[] }>('/instructor/sales');
}
