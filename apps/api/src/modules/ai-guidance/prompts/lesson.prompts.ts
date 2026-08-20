export interface LessonContentPromptInput {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonSummary: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  visualsPreferred: boolean;
}

export const LESSON_CONTENT_SYSTEM_PROMPT =
  'You are an expert educator and instructional designer. Write complete, readable lesson ' +
  'material that teaches one topic clearly before any quiz or exercise. Explain concepts in ' +
  'plain language, use concrete examples, and break the topic into logical sections. ' +
  'When visuals are requested, include structured visual descriptions learners can follow. ' +
  'Always return valid JSON with "summary", "sections", and "keyPoints".';

export function buildLessonContentPrompt(input: LessonContentPromptInput): string {
  const visualRules = input.visualsPreferred
    ? [
        '- Visual mode is ON: include a "visual" object on at least 2 sections.',
        '- Each visual must describe what the learner should picture (diagram, timeline, comparison, flowchart, or infographic).',
        '- Use "elements" for labeled parts, steps, or comparison rows (2–6 short items).',
      ]
    : [
        '- Visual mode is OFF: omit the "visual" field on all sections.',
        '- Still use clear examples and step-by-step explanations in prose.',
      ];

  return [
    `Course: ${input.courseTitle}`,
    `Module: ${input.moduleTitle}`,
    `Lesson topic: ${input.lessonTitle}`,
    `Outline hint: ${input.lessonSummary}`,
    `Category: ${input.category}`,
    `Level: ${input.level}`,
    '',
    'Write a full lesson the learner can read from start to finish. Do NOT reply with only a short summary.',
    'Each section must briefly but properly explain its sub-topic with enough detail to understand the lesson.',
    '',
    'Return a JSON object with exactly this structure:',
    '{',
    '  "summary": "<2–3 sentences: what this lesson covers and why it matters>",',
    '  "sections": [',
    '    {',
    '      "title": "<clear sub-topic heading>",',
    '      "body": "<3–5 short paragraphs. Separate paragraphs with blank lines (\\n\\n). Explain definitions, how it works, and a simple example.>",',
    '      "visual": {',
    '        "type": "diagram" | "timeline" | "comparison" | "flowchart" | "infographic",',
    '        "title": "<visual heading>",',
    '        "description": "<what the visual shows and how to read it>",',
    '        "elements": ["<label or step>", "..."]',
    '      }',
    '    }',
    '  ],',
    '  "keyPoints": ["<important takeaway>", "..."]',
    '}',
    '',
    'Requirements:',
    '- Provide 4 to 5 sections that progress from basics to application.',
    '- Every section "body" must be substantive (multiple paragraphs, not one-liners).',
    '- Teach the topic step by step: define → explain → example → common mistakes or tips where relevant.',
    '- Provide 4 to 6 keyPoints.',
    ...visualRules,
  ].join('\n');
}
