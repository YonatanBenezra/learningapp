import { asyncHandler } from '../../common/utils/asyncHandler';
import * as service from './instructor.service';
import * as structureService from './instructor.structure.service';

export const getDashboard = asyncHandler(async (req, res) => {
  res.json(await service.getDashboard(req.user!.id));
});

export const listCourses = asyncHandler(async (req, res) => {
  res.json({ courses: await service.listInstructorCourses(req.user!.id) });
});

export const getCourse = asyncHandler(async (req, res) => {
  res.json({ course: await service.getInstructorCourse(req.user!.id, req.params.id) });
});

export const createCourse = asyncHandler(async (req, res) => {
  const course = await service.createInstructorCourse(req.user!.id, req.body);
  res.status(202).json({ course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await service.updateInstructorCourse(req.user!.id, req.params.id, req.body);
  res.json({ course });
});

export const publishCourse = asyncHandler(async (req, res) => {
  const course = await service.publishInstructorCourse(req.user!.id, req.params.id);
  res.json({ course });
});

export const unpublishCourse = asyncHandler(async (req, res) => {
  const course = await service.unpublishInstructorCourse(req.user!.id, req.params.id);
  res.json({ course });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  await service.deleteInstructorCourse(req.user!.id, req.params.id);
  res.json({ deleted: true });
});

export const updateModuleTitle = asyncHandler(async (req, res) => {
  const moduleDoc = await structureService.updateInstructorModuleTitle(
    req.user!.id,
    req.params.courseId,
    req.params.moduleId,
    req.body.title,
  );
  res.json({ module: moduleDoc });
});

export const deleteModule = asyncHandler(async (req, res) => {
  await structureService.deleteInstructorModule(
    req.user!.id,
    req.params.courseId,
    req.params.moduleId,
  );
  res.json({ deleted: true });
});

export const updateLessonTitle = asyncHandler(async (req, res) => {
  const lesson = await structureService.updateInstructorLessonTitle(
    req.user!.id,
    req.params.courseId,
    req.params.lessonId,
    req.body.title,
  );
  res.json({ lesson });
});

export const updateLessonContent = asyncHandler(async (req, res) => {
  const lesson = await structureService.updateInstructorLessonContent(
    req.user!.id,
    req.params.courseId,
    req.params.lessonId,
    req.body,
  );
  res.json({ lesson });
});

export const deleteLesson = asyncHandler(async (req, res) => {
  await structureService.deleteInstructorLesson(
    req.user!.id,
    req.params.courseId,
    req.params.lessonId,
  );
  res.json({ deleted: true });
});

export const reorderStructure = asyncHandler(async (req, res) => {
  await structureService.reorderInstructorStructure(req.user!.id, req.params.courseId, req.body);
  res.json({ reordered: true });
});

export const listSales = asyncHandler(async (req, res) => {
  res.json({ sales: await service.listSales(req.user!.id) });
});

export const listMarketplaceCourses = asyncHandler(async (_req, res) => {
  res.json({ courses: await service.listPublishedCourses() });
});

export const getMarketplaceCourse = asyncHandler(async (req, res) => {
  res.json(await service.getPublishedCourse(req.params.id));
});

export const purchaseCourse = asyncHandler(async (req, res) => {
  const sale = await service.recordCoursePurchase(req.params.id, req.user!.id);
  res.status(201).json({ sale });
});
