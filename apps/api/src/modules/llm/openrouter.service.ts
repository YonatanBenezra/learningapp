import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.schema';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatOptions = {
  maxTokens?: number;
  temperature?: number;
};

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  isConfigured(): boolean {
    return Boolean(this.config.get('OPENROUTER_API_KEY', { infer: true })?.trim());
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const apiKey = this.config.get('OPENROUTER_API_KEY', { infer: true })?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI grading is not configured. Set OPENROUTER_API_KEY on the API.',
      );
    }

    const model = this.config.get('OPENROUTER_MODEL', { infer: true });
    const referer = this.config.get('PUBLIC_WEB_URL', { infer: true });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': 'LabPath',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens ?? 320,
        temperature: options.temperature ?? 0.2,
      }),
    });

    const body = (await response.json()) as {
      error?: { message?: string };
      choices?: { message?: { content?: string } }[];
    };

    if (!response.ok) {
      const detail = body.error?.message ?? response.statusText;
      this.logger.warn(`OpenRouter error ${response.status}: ${detail}`);
      const hint =
        /no endpoints found/i.test(detail)
          ? ` Model "${model}" is unavailable on OpenRouter — set OPENROUTER_MODEL to a current id (e.g. google/gemini-2.5-flash).`
          : '';
      throw new ServiceUnavailableException(`AI grading failed: ${detail}${hint}`);
    }

    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new ServiceUnavailableException('AI grading returned an empty response.');
    }

    return text;
  }
}
