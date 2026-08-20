export type AsyncJobState = 'pending' | 'processing' | 'ready' | 'failed';

export interface ApiError {
  error: string;
  details?: unknown;
}
