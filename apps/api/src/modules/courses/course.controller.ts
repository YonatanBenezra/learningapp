import { asyncHandler } from '../../common/utils/asyncHandler';
import { listCuratedCourses } from './curatedCourse.service';
import * as courseService from './course.service';
import * as lessonService from '../lessons/lesson.service';

export const createCourse = asyncHandler(async (req, res) => {
  const course = await courseService.createCourse(req.user!.id, req.body);
  // 202 Accepted — generation runs asynchronously; poll GET /courses/:id for status.
  res.status(202).json({ course });
});

export const listCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.listCourses(req.user!.id);
  res.json({ courses });
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourse(req.user!.id, req.params.id);
  res.json({ course });
});

export const getCourseStructure = asyncHandler(async (req, res) => {
  const structure = await courseService.getStructure(req.user!.id, req.params.id);
  res.json(structure);
});

export const listCurated = asyncHandler(async (_req, res) => {
  const courses = await listCuratedCourses();
  res.json({ courses });
});

export const getCuratedBySlug = asyncHandler(async (req, res) => {
  const course = await courseService.getCuratedCoursePublic(req.params.slug);
  res.json({ course });
});

export const getCuratedById = asyncHandler(async (req, res) => {
  const course = await courseService.getCuratedCoursePublicById(
    req.params.courseId,
    req.user?.id,
  );
  res.json({ course });
});

export const getCuratedStructure = asyncHandler(async (req, res) => {
  const structure = await courseService.getCuratedStructurePublic(req.params.courseId);
  res.json(structure);
});

export const getCuratedLesson = asyncHandler(async (req, res) => {
  const data = await lessonService.getCuratedLessonPublic(req.params.lessonId, req.user?.id);
  res.json(data);
});
