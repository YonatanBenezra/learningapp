import { AppError } from '../../common/errors/AppError';

// Typed error for all AI-provider failures. Extends AppError so the HTTP layer
// renders it as 502 with a clean body rather than crashing (§14 DoD).
export class AiError extends AppError {
  constructor(
    message: string,
    public readonly retryable = false,
    public readonly cause?: unknown,
  ) {
    super(502, message);
    this.name = 'AiError';
  }
}
