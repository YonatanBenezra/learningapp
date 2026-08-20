export interface LessonVisual {
  type: 'diagram' | 'timeline' | 'comparison' | 'flowchart' | 'infographic';
  title: string;
  description: string;
  elements?: string[];
}

export interface LessonSection {
  title: string;
  body: string;
  visual?: LessonVisual;
}

export interface StoredLessonContent {
  summary?: string;
  sections?: LessonSection[];
  keyPoints?: string[];
}

export function isStoredLessonContent(value: unknown): value is StoredLessonContent {
  return Boolean(value) && typeof value === 'object';
}

function visualToText(visual: LessonVisual): string {
  const parts = [`Visual (${visual.type}): ${visual.title}`, visual.description.trim()];
  if (Array.isArray(visual.elements) && visual.elements.length > 0) {
    parts.push(visual.elements.map((item) => `- ${item.trim()}`).join('\n'));
  }
  return parts.join('\n');
}

/** Flatten stored lesson content into text for quiz/exercise generation. */
export function lessonContentSummary(content: unknown, fallback: string): string {
  if (!isStoredLessonContent(content)) return fallback;

  const parts: string[] = [];
  if (typeof content.summary === 'string' && content.summary.trim()) {
    parts.push(content.summary.trim());
  }

  if (Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (!section || typeof section !== 'object') continue;
      const title = 'title' in section && typeof section.title === 'string' ? section.title.trim() : '';
      const body = 'body' in section && typeof section.body === 'string' ? section.body.trim() : '';
      const block: string[] = [];
      if (title) block.push(title);
      if (body) block.push(body);
      if ('visual' in section && section.visual && typeof section.visual === 'object') {
        block.push(visualToText(section.visual as LessonVisual));
      }
      if (block.length > 0) parts.push(block.join('\n'));
    }
  }

  if (Array.isArray(content.keyPoints)) {
    const points = content.keyPoints.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
    if (points.length > 0) {
      parts.push(`Key points:\n${points.map((p) => `- ${p.trim()}`).join('\n')}`);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : fallback;
}
