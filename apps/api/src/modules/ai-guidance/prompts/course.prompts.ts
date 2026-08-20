// Prompt templates for Course generation (§1.3). Consumed by course.generator (Phase 3).
export interface CoursePromptInput {
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  visualsPreferred: boolean;
}

export const COURSE_SYSTEM_PROMPT =
  'You are an expert curriculum designer. Generate a structured, progressive course as ' +
  'ordered Modules, each containing ordered Lessons. Titles must be concise and the ' +
  'sequence pedagogically sound (fundamentals before advanced topics). ' +
  'Always return valid JSON with "title" (string) and "modules" (array) at the top level. ' +
  'Each module must have "title", "domain", and "lessons". Each lesson must have "title" and "summary".';

export function buildCoursePrompt(input: CoursePromptInput): string {
  const style = input.visualsPreferred ? 'visual/diagram-heavy' : 'text-focused';
  return [
    `Category: ${input.category}`,
    `Topics: ${input.topics.join(', ')}`,
    `Level: ${input.level}`,
    `Preferred content style: ${style}`,
    '',
    'Produce a course broken into modules, each with an ordered list of lessons.',
    '',
    'Return a JSON object with exactly this structure:',
    '{',
    '  "title": "<course title>",',
    '  "modules": [',
    '    {',
    '      "title": "<module title>",',
    '      "domain": "programming" | "networking" | "cybersecurity" | "os" | "general",',
    '      "lessons": [',
    '        {',
    '          "title": "<lesson title>",',
    '          "summary": "<one- or two-sentence summary>"',
    '        }',
    '      ]',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}
