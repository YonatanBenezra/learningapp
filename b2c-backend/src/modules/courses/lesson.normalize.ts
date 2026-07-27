import { z } from 'zod';
import { AiError } from '../ai-guidance/ai.error';
import {
  GeneratedLessonContentSchema,
  type GeneratedLessonContent,
} from './lesson.schemas';

const VISUAL_TYPES = ['diagram', 'timeline', 'comparison', 'flowchart', 'infographic'] as const;
type VisualType = (typeof VISUAL_TYPES)[number];

const VISUAL_TYPE_ALIASES: Record<string, VisualType> = {
  chart: 'diagram',
  graph: 'diagram',
  image: 'infographic',
  table: 'comparison',
  map: 'flowchart',
  process: 'flowchart',
};

function ensureMinLength(text: string, min: number): string {
  const trimmed = text.trim();
  if (trimmed.length >= min) return trimmed;

  const padding =
    ' This section expands on the core ideas with examples and practical guidance for learners.';
  let result = trimmed;
  while (result.length < min) {
    result += padding;
  }
  return result;
}

function normalizeVisualType(value: unknown): VisualType {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if ((VISUAL_TYPES as readonly string[]).includes(normalized)) {
      return normalized as VisualType;
    }
    const alias = VISUAL_TYPE_ALIASES[normalized];
    if (alias) return alias;
  }
  return 'diagram';
}

function normalizeVisual(
  visual: {
    type?: unknown;
    title?: unknown;
    description?: unknown;
    elements?: unknown;
  },
  sectionTitle: string,
): NonNullable<GeneratedLessonContent['sections'][number]['visual']> {
  const type = normalizeVisualType(visual.type);
  const title =
    typeof visual.title === 'string' && visual.title.trim()
      ? visual.title.trim()
      : `${sectionTitle} overview`;
  const description = ensureMinLength(
    typeof visual.description === 'string' && visual.description.trim()
      ? visual.description.trim()
      : `A ${type} illustrating ${sectionTitle.toLowerCase()}.`,
    60,
  );
  const rawElements = Array.isArray(visual.elements)
    ? visual.elements.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const elements =
    rawElements.length >= 2
      ? rawElements.slice(0, 8)
      : ['Core idea', 'Supporting detail', 'Practical takeaway'];

  return { type, title, description, elements };
}

function defaultVisual(sectionTitle: string): NonNullable<
  GeneratedLessonContent['sections'][number]['visual']
> {
  return normalizeVisual({}, sectionTitle);
}

export const LenientLessonVisualSchema = z
  .object({
    type: z.unknown().optional(),
    title: z.unknown().optional(),
    description: z.unknown().optional(),
    elements: z.array(z.unknown()).optional(),
  })
  .nullish();

export const LenientLessonSectionSchema = z.object({
  title: z.coerce.string().min(1),
  body: z.coerce.string().min(1),
  visual: LenientLessonVisualSchema,
});

export const LenientLessonContentSchema = z.object({
  summary: z.coerce.string().min(1),
  sections: z.array(LenientLessonSectionSchema).min(1),
  keyPoints: z.array(z.coerce.string().min(1)).min(1),
});

function preprocessLessonRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;

  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.sections)) return raw;

  return {
    ...data,
    sections: data.sections.map((section) => {
      if (!section || typeof section !== 'object') return section;
      const entry = section as Record<string, unknown>;
      return {
        ...entry,
        visual: entry.visual === null ? undefined : entry.visual,
      };
    }),
  };
}

export function normalizeLessonContent(
  raw: z.infer<typeof LenientLessonContentSchema>,
  input: { visualsPreferred: boolean; lessonTitle: string },
): GeneratedLessonContent {
  type WorkingSection = {
    title: string;
    body: string;
    visual?: NonNullable<GeneratedLessonContent['sections'][number]['visual']>;
  };

  let sections: WorkingSection[] = raw.sections.slice(0, 6).map((section) => {
    const title = section.title.trim();
    const visual = section.visual ? normalizeVisual(section.visual, title) : undefined;
    return {
      title,
      body: ensureMinLength(section.body, 180),
      visual,
    };
  });

  while (sections.length < 4) {
    sections.push({
      title: `Additional concepts (${sections.length + 1})`,
      body: ensureMinLength(
        `This section reinforces ${input.lessonTitle} with extra context and examples.`,
        180,
      ),
    });
  }

  let keyPoints = raw.keyPoints.map((point) => point.trim()).filter(Boolean);
  while (keyPoints.length < 4) {
    keyPoints.push(`Review the key ideas from ${input.lessonTitle}`);
  }
  keyPoints = keyPoints.slice(0, 8);

  if (input.visualsPreferred) {
    let withVisual = sections.filter((section) => section.visual).length;
    for (let i = 0; i < sections.length && withVisual < 2; i += 1) {
      if (!sections[i].visual) {
        sections[i] = { ...sections[i], visual: defaultVisual(sections[i].title) };
        withVisual += 1;
      }
    }

    return {
      summary: ensureMinLength(raw.summary, 80),
      sections: sections.slice(0, 6).map(({ title, body, visual }) => ({ title, body, visual })),
      keyPoints,
    };
  }

  return {
    summary: ensureMinLength(raw.summary, 80),
    sections: sections.slice(0, 6).map(({ title, body }) => ({ title, body })),
    keyPoints,
  };
}

export function parseGeneratedLessonContent(
  raw: unknown,
  input: { visualsPreferred: boolean; lessonTitle: string },
): GeneratedLessonContent {
  const lenient = LenientLessonContentSchema.safeParse(preprocessLessonRaw(raw));
  if (!lenient.success) {
    throw new AiError('AI structured output failed schema validation', false, lenient.error);
  }

  const normalized = normalizeLessonContent(lenient.data, input);
  const parsed = GeneratedLessonContentSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new AiError('AI structured output failed schema validation', false, parsed.error);
  }
  return parsed.data;
}
