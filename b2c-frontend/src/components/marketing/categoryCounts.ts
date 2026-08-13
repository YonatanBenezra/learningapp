import { CATEGORIES } from './data';

export const CATEGORY_TITLES = CATEGORIES.map((category) => category.title);

const ALIAS_TO_TITLE: Record<string, string> = {
  programming: 'Programming',
  'artificial intelligence': 'Artificial Intelligence',
  ai: 'Artificial Intelligence',
  'machine learning': 'Artificial Intelligence',
  'cyber security': 'Cyber Security',
  cybersecurity: 'Cyber Security',
  networking: 'Networking',
  'data science': 'Data Science',
  data: 'Data Science',
  'health & fitness': 'Health & Fitness',
  'health and fitness': 'Health & Fitness',
  security: 'Security',
  general: 'General',
  'web development': 'Programming',
  'mobile development': 'Programming',
  devops: 'Networking',
  'cloud computing': 'Networking',
  database: 'Data Science',
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
