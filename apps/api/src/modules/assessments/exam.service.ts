import { Types } from 'mongoose';
import { Exam } from './exam.model';
import { ExamSubmission } from './examSubmission.model';
import { Module } from '../modules-content/module.model';
import { Course } from '../courses/course.model';
import { AppError } from '../../common/errors/AppError';
import { getAiClient } from '../ai-guidance/ai.client';
import { EXAM_SYSTEM_PROMPT, buildExamPrompt } from '../ai-guidance/prompts';
import { safeAward } from '../gamification/gamification.service';
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
  const submission = await ExamSubmission.create({ examId: exam._id, userId, answers, results, score });
  await safeAward(userId, { assessmentScore: score }); // §3 assessment achievements
  return submission;
}

export async function listMyExamSubmissions(userId: string) {
  const submissions = await ExamSubmission.find({ userId })
    .sort({ submittedAt: -1 })
    .limit(50)
    .lean();
  if (submissions.length === 0) return [];

  const examIds = [...new Set(submissions.map((s) => String(s.examId)))];
  const exams = await Exam.find({ _id: { $in: examIds }, userId }).lean();
  const examMap = new Map(exams.map((e) => [String(e._id), e]));

  const moduleIds = exams.filter((e) => e.scope === 'module').map((e) => e.scopeId);
  const courseIds = exams.filter((e) => e.scope === 'course').map((e) => e.scopeId);
  const [modules, courses] = await Promise.all([
    moduleIds.length ? Module.find({ _id: { $in: moduleIds } }).lean() : [],
    courseIds.length ? Course.find({ _id: { $in: courseIds }, userId }).lean() : [],
  ]);
  const moduleMap = new Map(modules.map((m) => [String(m._id), m]));
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));

  return submissions.map((s) => {
    const exam = examMap.get(String(s.examId));
    const scope = exam?.scope as 'module' | 'course' | undefined;
    const scopeId = exam ? String(exam.scopeId) : null;
    let scopeTitle = 'Exam';
    if (exam && scope === 'module') {
      scopeTitle = (moduleMap.get(String(exam.scopeId))?.title as string | undefined) ?? 'Module exam';
    } else if (exam && scope === 'course') {
      scopeTitle = (courseMap.get(String(exam.scopeId))?.title as string | undefined) ?? 'Course exam';
    }
    return {
      id: String(s._id),
      examId: String(s.examId),
      scope: scope ?? 'module',
      scopeId,
      scopeTitle,
      score: s.score as number,
      submittedAt: s.submittedAt as Date,
      questionCount: Array.isArray(exam?.questions) ? exam!.questions.length : 0,
    };
  });
}
