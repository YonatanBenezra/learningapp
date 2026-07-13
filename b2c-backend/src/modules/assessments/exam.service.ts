import { Types } from 'mongoose';
import { Exam } from './exam.model';
import { ExamSubmission } from './examSubmission.model';
import { Module } from '../modules-content/module.model';
import { Course } from '../courses/course.model';
import { AppError } from '../../common/errors/AppError';
import { getAiClient } from '../ai-guidance/ai.client';
import { EXAM_SYSTEM_PROMPT, buildExamPrompt } from '../ai-guidance/prompts';
import {
  GeneratedAssessmentSchema,
  type GeneratedAssessment,
  type GeneratedQuestion,
  type SubmittedAnswer,
} from './assessment.schema';
import { gradeSubmission, type ShortAnswerJudge } from './grading.service';

export type ExamGenerator = (input: {
  scope: 'module' | 'course';
  scopeTitle: string;
  topics: string[];
  userId: string;
}) => Promise<GeneratedAssessment>;

const defaultExamGenerator: ExamGenerator = async ({ scope, scopeTitle, topics, userId }) => {
  const result = await getAiClient().completeStructured(
    {
      system: EXAM_SYSTEM_PROMPT,
      prompt: buildExamPrompt({ scope, scopeTitle, topics }),
      useCase: 'exam',
      userId,
    },
    GeneratedAssessmentSchema,
  );
  return result.data;
};

async function resolveOwnedModule(userId: string, moduleId: string) {
  if (!Types.ObjectId.isValid(moduleId)) throw new AppError(404, 'Module not found');
  const mod = await Module.findById(moduleId);
  if (!mod) throw new AppError(404, 'Module not found');
  const course = await Course.findOne({ _id: mod.courseId, userId });
  if (!course) throw new AppError(404, 'Module not found');
  return { mod, course };
}

async function resolveOwnedCourse(userId: string, courseId: string) {
  if (!Types.ObjectId.isValid(courseId)) throw new AppError(404, 'Course not found');
  const course = await Course.findOne({ _id: courseId, userId });
  if (!course) throw new AppError(404, 'Course not found');
  return course;
}

export async function generateModuleExam(
  userId: string,
  moduleId: string,
  generate: ExamGenerator = defaultExamGenerator,
) {
  const { mod, course } = await resolveOwnedModule(userId, moduleId);
  const generated = await generate({
    scope: 'module',
    scopeTitle: mod.title as string,
    topics: (course.topics as unknown as string[]) ?? [],
    userId,
  });
  return Exam.create({ scope: 'module', scopeId: mod._id, userId, questions: generated.questions });
}

export async function generateCourseExam(
  userId: string,
  courseId: string,
  generate: ExamGenerator = defaultExamGenerator,
) {
  const course = await resolveOwnedCourse(userId, courseId);
  const generated = await generate({
    scope: 'course',
    scopeTitle: course.title as string,
    topics: (course.topics as unknown as string[]) ?? [],
    userId,
  });
  return Exam.create({
    scope: 'course',
    scopeId: course._id,
    userId,
    questions: generated.questions,
  });
}

export async function getExam(userId: string, examId: string) {
  if (!Types.ObjectId.isValid(examId)) throw new AppError(404, 'Exam not found');
  const exam = await Exam.findOne({ _id: examId, userId });
  if (!exam) throw new AppError(404, 'Exam not found');
  return exam;
}

export async function submitExam(
  userId: string,
  examId: string,
  answers: SubmittedAnswer[],
  judge?: ShortAnswerJudge,
) {
  const exam = await getExam(userId, examId);
  const { score, results } = await gradeSubmission(
    exam.questions as unknown as GeneratedQuestion[],
    answers,
    judge,
  );
  return ExamSubmission.create({ examId: exam._id, userId, answers, results, score });
}
