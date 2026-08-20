import { asyncHandler } from '../../common/utils/asyncHandler';
import * as courseService from './course.service';

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
