import { z } from 'zod';
import { AiError } from '../ai-guidance/ai.error';
import {
  GeneratedCourseSchema,
  GeneratedLessonSchema,
  type GeneratedCourse,
} from './course.schemas';

export {
  GeneratedCourseSchema,
  GeneratedModuleSchema,
  GeneratedLessonSchema,
  type GeneratedCourse,
} from './course.schemas';

export const COURSE_DOMAINS = [
  'programming',
  'networking',
  'cybersecurity',
  'os',
  'general',
] as const;

export type CourseDomain = (typeof COURSE_DOMAINS)[number];

const DOMAIN_ALIASES: Record<string, CourseDomain> = {
  cyber_security: 'cybersecurity',
  cyber: 'cybersecurity',
  security: 'cybersecurity',
  infosec: 'cybersecurity',
  net: 'networking',
  network: 'networking',
  networks: 'networking',
  code: 'programming',
  dev: 'programming',
  development: 'programming',
  software: 'programming',
  data: 'programming',
  data_science: 'programming',
  ai: 'programming',
  artificial_intelligence: 'programming',
  ml: 'programming',
  machine_learning: 'programming',
  linux: 'os',
  operating_system: 'os',
  operating_systems: 'os',
  windows: 'os',
  macos: 'os',
  general_purpose: 'general',
  other: 'general',
  health: 'general',
  fitness: 'general',
};

function inferDomainFromCategory(category?: string): CourseDomain {
  const c = (category ?? '').toLowerCase();
  if (c.includes('network')) return 'networking';
  if (c.includes('cyber') || c.includes('security')) return 'cybersecurity';
  if (
    c.includes('program') ||
    c.includes('code') ||
    c.includes('software') ||
    c.includes('data') ||
    c.includes('ai')
  ) {
    return 'programming';
  }
  if (c.includes('operating') || /\bos\b/.test(c)) return 'os';
  return 'general';
}

export function normalizeDomain(value: unknown, category?: string): CourseDomain {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if ((COURSE_DOMAINS as readonly string[]).includes(normalized)) {
      return normalized as CourseDomain;
    }
    const alias = DOMAIN_ALIASES[normalized];
    if (alias) return alias;
  }
  return inferDomainFromCategory(category);
}

export const LenientGeneratedModuleSchema = z.object({
  title: z.string().min(1),
  domain: z.unknown().optional(),
  lessons: z.array(GeneratedLessonSchema).min(1),
});

export const LenientGeneratedCourseSchema = z.object({
  title: z.string().min(1),
  modules: z.array(LenientGeneratedModuleSchema).min(1),
});

export function normalizeGeneratedCourse(
  raw: z.infer<typeof LenientGeneratedCourseSchema>,
  category: string,
): GeneratedCourse {
  return {
    title: raw.title.trim(),
    modules: raw.modules.map((module) => ({
      title: module.title.trim(),
      domain: normalizeDomain(module.domain, category),
      lessons: module.lessons.map((lesson) => ({
        title: lesson.title.trim(),
        summary: lesson.summary.trim(),
      })),
    })),
  };
}

export function parseGeneratedCourse(raw: unknown, category: string): GeneratedCourse {
  const lenient = LenientGeneratedCourseSchema.safeParse(raw);
  if (!lenient.success) {
    throw new AiError('AI structured output failed schema validation', false, lenient.error);
  }

  const normalized = normalizeGeneratedCourse(lenient.data, category);
  const parsed = GeneratedCourseSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new AiError('AI structured output failed schema validation', false, parsed.error);
  }
  return parsed.data;
}
