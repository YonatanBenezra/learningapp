import { AppError } from '../../common/errors/AppError';

export function resolveCorrectOption(options: string[], correctAnswer: string): string {
  const trimmed = correctAnswer.trim();
  const match =
    options.find((o) => o === trimmed) ??
    options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
  if (!match) {
    throw new AppError(502, 'AI correctAnswer does not match any option');
  }
  return match;
}

export function shuffleMcqOptions(
  options: string[],
  correctAnswer: string,
  random: () => number = Math.random,
): { options: string[]; correctAnswer: string } {
  const resolved = resolveCorrectOption(options, correctAnswer);
  const shuffled = [...new Set(options.map((o) => o.trim()).filter(Boolean))];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { options: shuffled, correctAnswer: resolved };
}
