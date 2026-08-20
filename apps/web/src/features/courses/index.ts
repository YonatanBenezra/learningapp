export * as coursesApi from './coursesApi';
export type {
  CreateCourseInput,
  CourseStructure,
  StructureModule,
  StructureLesson,
} from './coursesApi';
export { useCreateCourse, useCourse, useCourses, useCourseStructure } from './useCourses';
export { MyCoursesPage } from './MyCoursesPage';
