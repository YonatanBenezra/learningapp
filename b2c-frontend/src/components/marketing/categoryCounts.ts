import { MARKETING_AI_CATEGORIES } from '@/src/constants/aiCategories';

export const CATEGORIES = MARKETING_AI_CATEGORIES;

export const CATEGORY_TITLES = CATEGORIES.map((category) => category.title);

const ALIAS_TO_TITLE: Record<string, string> = {
  ai: 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence',
  'machine learning': 'Machine Learning',
  ml: 'Machine Learning',
  'deep learning': 'Deep Learning',
  dl: 'Deep Learning',
  'data science': 'Data Science',
  data: 'Data Science',
  nlp: 'Natural Language Processing',
  'natural language processing': 'Natural Language Processing',
  'computer vision': 'Computer Vision',
  cv: 'Computer Vision',
  'generative ai': 'Generative AI',
  genai: 'Generative AI',
  'prompt engineering': 'Prompt Engineering',
  // Legacy non-AI categories map to closest AI track
  programming: 'Prompt Engineering',
  'web development': 'Prompt Engineering',
  'mobile development': 'Prompt Engineering',
  cybersecurity: 'Artificial Intelligence',
  'cyber security': 'Artificial Intelligence',
  networking: 'Artificial Intelligence',
  devops: 'Artificial Intelligence',
  'cloud computing': 'Generative AI',
  cloud: 'Generative AI',
  database: 'Data Science',
  business: 'Generative AI',
  design: 'Computer Vision',
  'health & fitness': 'Artificial Intelligence',
  'health and fitness': 'Artificial Intelligence',
  security: 'Artificial Intelligence',
  general: 'Artificial Intelligence',
  other: 'Artificial Intelligence',
};

export function resolveCategoryTitle(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const direct = CATEGORY_TITLES.find(
    (title) => title.toLowerCase() === trimmed.toLowerCase(),
  );
  if (direct) return direct;

  return ALIAS_TO_TITLE[trimmed.toLowerCase()] ?? null;
}

export function buildCategoryCounts(courses: { category: string }[]): Map<string, number> {
  const counts = new Map<string, number>(
    CATEGORY_TITLES.map((title) => [title, 0]),
  );

  for (const course of courses) {
    const title = resolveCategoryTitle(course.category);
    if (!title) continue;
    counts.set(title, (counts.get(title) ?? 0) + 1);
  }

  return counts;
}
