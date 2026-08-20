import { z } from 'zod';

export const GeneratedLessonSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
});

export const GeneratedModuleSchema = z.object({
  title: z.string().min(1),
  domain: z.enum(['programming', 'networking', 'cybersecurity', 'os', 'general']),
  lessons: z.array(GeneratedLessonSchema).min(1),
});

export const GeneratedCourseSchema = z.object({
  title: z.string().min(1),
  modules: z.array(GeneratedModuleSchema).min(1),
});

export type GeneratedCourse = z.infer<typeof GeneratedCourseSchema>;
