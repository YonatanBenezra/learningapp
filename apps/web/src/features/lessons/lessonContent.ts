import type { LessonContent, LessonVisual } from '@/src/features/lessons/lessonsApi';

export interface ParsedLessonSection {
  title: string;
  paragraphs: string[];
  visual: LessonVisual | null;
}

export interface ParsedLessonContent {
  intro: string | null;
  sections: ParsedLessonSection[];
  keyPoints: string[];
  hasBody: boolean;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseVisual(value: unknown): LessonVisual | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const type = record.type;
  const title = record.title;
  const description = record.description;
  if (
    typeof type !== 'string' ||
    typeof title !== 'string' ||
    typeof description !== 'string' ||
    !title.trim() ||
    !description.trim()
  ) {
    return null;
  }

  const elements = Array.isArray(record.elements)
    ? record.elements.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined;

  return {
    type: type as LessonVisual['type'],
    title: title.trim(),
    description: description.trim(),
    elements,
  };
}

export function parseLessonContent(content: LessonContent | null | undefined): ParsedLessonContent {
  const intro =
    content && typeof content.summary === 'string' && content.summary.trim()
      ? content.summary.trim()
      : null;

  const sections = Array.isArray(content?.sections)
    ? content.sections
        .map((section) => {
          if (!section || typeof section !== 'object') return null;
          const title = 'title' in section && typeof section.title === 'string' ? section.title.trim() : '';
          const body = 'body' in section && typeof section.body === 'string' ? section.body.trim() : '';
          const visual = 'visual' in section ? parseVisual(section.visual) : null;
          if (!title && !body && !visual) return null;
          return {
            title,
            paragraphs: body ? splitParagraphs(body) : [],
            visual,
          };
        })
        .filter((section): section is ParsedLessonSection => section !== null)
    : [];

  const keyPoints = Array.isArray(content?.keyPoints)
    ? content.keyPoints.filter((point): point is string => typeof point === 'string' && point.trim().length > 0)
    : [];

  const hasBody =
    Boolean(intro) ||
    sections.some((section) => section.paragraphs.length > 0 || section.visual) ||
    keyPoints.length > 0;

  return { intro, sections, keyPoints, hasBody };
}
