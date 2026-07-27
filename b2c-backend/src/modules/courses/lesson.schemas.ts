import { z } from 'zod';

export const GeneratedLessonVisualSchema = z.object({
  type: z.enum(['diagram', 'timeline', 'comparison', 'flowchart', 'infographic']),
  title: z.string().min(1),
  description: z.string().min(40),
  elements: z.array(z.string().min(1)).min(2).max(8).optional(),
});

export const GeneratedLessonSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(180),
  visual: GeneratedLessonVisualSchema.optional(),
});

export const GeneratedLessonContentSchema = z.object({
  summary: z.string().min(80),
  sections: z.array(GeneratedLessonSectionSchema).min(4).max(6),
  keyPoints: z.array(z.string().min(1)).min(4).max(8),
});

export type GeneratedLessonContent = z.infer<typeof GeneratedLessonContentSchema>;
