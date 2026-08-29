import { Injectable } from '@nestjs/common';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export type UpsertPayload = {
  slugs?: string[];
};

@Injectable()
export class IngestService {
  async upsertExercises(payload: UpsertPayload) {
    const scriptPath = path.join(
      process.cwd(),
      'scripts/content/ingest-local.mjs',
    );
    const moduleUrl = pathToFileURL(scriptPath).href;
    const module = (await import(moduleUrl)) as {
      upsertAllExercises: (slugs?: string[] | null) => Promise<string[]>;
    };
    const seeded = await module.upsertAllExercises(payload.slugs ?? null);
    return { ok: true, seeded, count: seeded.length };
  }
}
