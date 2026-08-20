export function problemTypeLabel(type: string): string {
  switch (type) {
    case 'mcq':
      return 'Concept';
    case 'code':
      return 'Coding';
    case 'prompt_design':
      return 'AI Eng';
    case 'short_answer':
      return 'AI Eng';
    default:
      return type;
  }
}

export function difficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'text-good';
    case 'medium':
      return 'text-warn';
    case 'hard':
      return 'text-bad';
    default:
      return 'text-ink-2';
  }
}
