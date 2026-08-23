export const PROMPT_LAB_PASS_SCORE = 70;

export const PROMPT_LAB_RUBRIC_CRITERIA = [
  { id: 'format', label: 'Valid JSON only', maxScore: 25 },
  { id: 'keys', label: 'Required keys', maxScore: 25 },
  { id: 'grounding', label: 'Grounded summary', maxScore: 50 },
] as const;

export const PROMPT_LAB_STARTER_PROMPTS = [
  {
    id: 'weak',
    label: 'Weak starter',
    prompt: 'Summarize this product review in a friendly paragraph.',
  },
  {
    id: 'medium',
    label: 'Partial structure',
    prompt: 'Return a title and summary for the review below. JSON preferred.',
  },
  {
    id: 'strong',
    label: 'Strong starter',
    prompt:
      'Summarize the product review below. Return JSON only with keys "title" and "summary". No markdown fences or extra prose.',
  },
] as const;
