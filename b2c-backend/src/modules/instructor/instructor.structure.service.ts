import { Types } from 'mongoose';
import { Course } from '../courses/course.model';
import { Module } from '../modules-content/module.model';
import { Lesson } from '../lessons/lesson.model';
import { AppError } from '../../common/errors/AppError';

async function getEditableCourse(instructorId: string, courseId: string) {
  const course = await Course.findOne({
    _id: courseId,
    userId: instructorId,
    kind: 'marketplace',
  });
  if (!course) throw new AppError(404, 'Course not found');
  if (course.status === 'generating') {
    throw new AppError(409, 'Wait until content generation finishes before editing structure.');
  }
  return course;
}

async function syncModuleOrders(courseId: Types.ObjectId) {
  const modules = await Module.find({ courseId }).sort({ order: 1 });
  const moduleIds: Types.ObjectId[] = [];

  for (let index = 0; index < modules.length; index += 1) {
    modules[index].order = index;
    await modules[index].save();
    moduleIds.push(modules[index]._id);
  }

  await Course.updateOne({ _id: courseId }, { moduleOrder: moduleIds });
}

async function syncLessonOrders(moduleId: Types.ObjectId) {
  const lessons = await Lesson.find({ moduleId }).sort({ order: 1 });
  const lessonIds: Types.ObjectId[] = [];

  for (let index = 0; index < lessons.length; index += 1) {
    lessons[index].order = index;
    await lessons[index].save();
    lessonIds.push(lessons[index]._id);
  }

  await Module.updateOne({ _id: moduleId }, { lessonOrder: lessonIds });
}

export async function updateInstructorModuleTitle(
  instructorId: string,
  courseId: string,
  moduleId: string,
  title: string,
) {
  const course = await getEditableCourse(instructorId, courseId);
  const moduleDoc = await Module.findOne({ _id: moduleId, courseId: course._id });
  if (!moduleDoc) throw new AppError(404, 'Module not found');

  moduleDoc.title = title.trim();
  await moduleDoc.save();
  return { id: String(moduleDoc._id), title: moduleDoc.title };
}

export async function deleteInstructorModule(
  instructorId: string,
  courseId: string,
  moduleId: string,
) {
  const course = await getEditableCourse(instructorId, courseId);
  const moduleDoc = await Module.findOne({ _id: moduleId, courseId: course._id });
  if (!moduleDoc) throw new AppError(404, 'Module not found');

  await Lesson.deleteMany({ moduleId: moduleDoc._id, courseId: course._id });
  await moduleDoc.deleteOne();
  await syncModuleOrders(course._id);
  return { deleted: true as const };
}

export async function updateInstructorLessonTitle(
  instructorId: string,
  courseId: string,
  lessonId: string,
  title: string,
) {
  const course = await getEditableCourse(instructorId, courseId);
  const lesson = await Lesson.findOne({ _id: lessonId, courseId: course._id });
  if (!lesson) throw new AppError(404, 'Lesson not found');

  lesson.title = title.trim();
  await lesson.save();
  return { id: String(lesson._id), title: lesson.title };
}

export interface UpdateLessonContentInput {
  title?: string;
  content: {
    summary?: string;
    sections: Array<{
      title: string;
      body: string;
      visual?: {
        type: 'diagram' | 'timeline' | 'comparison' | 'flowchart' | 'infographic';
        title: string;
        description: string;
        elements?: string[];
      } | null;
    }>;
    keyPoints: string[];
  };
}

export async function updateInstructorLessonContent(
  instructorId: string,
  courseId: string,
  lessonId: string,
  input: UpdateLessonContentInput,
) {
  const course = await getEditableCourse(instructorId, courseId);
  const lesson = await Lesson.findOne({ _id: lessonId, courseId: course._id });
  if (!lesson) throw new AppError(404, 'Lesson not found');

  if (input.title !== undefined) {
    lesson.title = input.title.trim();
  }

  lesson.content = {
    summary: input.content.summary?.trim() ?? '',
    sections: input.content.sections.map((section) => ({
      title: section.title.trim(),
      body: section.body.trim(),
      ...(section.visual ? { visual: section.visual } : {}),
    })),
    keyPoints: input.content.keyPoints.map((point) => point.trim()).filter(Boolean),
  };
  await lesson.save();

  return {
    id: String(lesson._id),
    title: lesson.title as string,
    content: lesson.content,
  };
}

export async function deleteInstructorLesson(
  instructorId: string,
  courseId: string,
  lessonId: string,
) {
  const course = await getEditableCourse(instructorId, courseId);
  const lesson = await Lesson.findOne({ _id: lessonId, courseId: course._id });
  if (!lesson) throw new AppError(404, 'Lesson not found');

  const moduleId = lesson.moduleId as Types.ObjectId;
  await lesson.deleteOne();
  await syncLessonOrders(moduleId);
  return { deleted: true as const };
}

export interface ReorderStructureInput {
  moduleOrder: string[];
  lessonsByModule: Record<string, string[]>;
}

export async function reorderInstructorStructure(
  instructorId: string,
  courseId: string,
  input: ReorderStructureInput,
) {
  const course = await getEditableCourse(instructorId, courseId);
  const modules = await Module.find({ courseId: course._id }).lean();
  const moduleIds = new Set(modules.map((module) => String(module._id)));

  if (input.moduleOrder.length !== modules.length) {
    throw new AppError(400, 'moduleOrder must include every module exactly once.');
  }

  const seenModules = new Set<string>();
  for (const moduleId of input.moduleOrder) {
    if (!moduleIds.has(moduleId) || seenModules.has(moduleId)) {
      throw new AppError(400, 'moduleOrder contains invalid or duplicate module ids.');
    }
    seenModules.add(moduleId);
  }

  const lessons = await Lesson.find({ courseId: course._id }).lean();
  const lessonsByModuleDb = new Map<string, Set<string>>();
  for (const lesson of lessons) {
    const moduleId = String(lesson.moduleId);
    if (!lessonsByModuleDb.has(moduleId)) lessonsByModuleDb.set(moduleId, new Set());
    lessonsByModuleDb.get(moduleId)!.add(String(lesson._id));
  }

  for (const moduleId of input.moduleOrder) {
    const expected = lessonsByModuleDb.get(moduleId) ?? new Set<string>();
    const provided = input.lessonsByModule[moduleId] ?? [];

    if (provided.length !== expected.size) {
      throw new AppError(400, `lessonsByModule for ${moduleId} must include every lesson exactly once.`);
    }

    const seenLessons = new Set<string>();
    for (const lessonId of provided) {
      if (!expected.has(lessonId) || seenLessons.has(lessonId)) {
        throw new AppError(400, `lessonsByModule for ${moduleId} contains invalid or duplicate lesson ids.`);
      }
      seenLessons.add(lessonId);
    }
  }

  const moduleObjectIds: Types.ObjectId[] = [];
  for (let moduleIndex = 0; moduleIndex < input.moduleOrder.length; moduleIndex += 1) {
    const moduleId = input.moduleOrder[moduleIndex];
    await Module.updateOne({ _id: moduleId, courseId: course._id }, { order: moduleIndex });
    moduleObjectIds.push(new Types.ObjectId(moduleId));

    const lessonIds = input.lessonsByModule[moduleId] ?? [];
    const lessonObjectIds: Types.ObjectId[] = [];
    for (let lessonIndex = 0; lessonIndex < lessonIds.length; lessonIndex += 1) {
      const lessonId = lessonIds[lessonIndex];
      await Lesson.updateOne(
        { _id: lessonId, moduleId, courseId: course._id },
        { order: lessonIndex },
      );
      lessonObjectIds.push(new Types.ObjectId(lessonId));
    }

    await Module.updateOne({ _id: moduleId }, { lessonOrder: lessonObjectIds });
  }

  await Course.updateOne({ _id: course._id }, { moduleOrder: moduleObjectIds });
  return { reordered: true as const };
}
