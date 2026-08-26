import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const BANNED =
  /from ['"](?:openai|@anthropic-ai\/sdk|@google\/generative-ai|together-ai)/;

describe('harnesses do not call provider SDKs', () => {
  it('has no provider SDK imports under harnesses/', () => {
    const root = path.join(__dirname, 'harnesses');
    const offenders: string[] = [];
    for (const file of walk(root)) {
      const src = readFileSync(file, 'utf8');
      if (BANNED.test(src)) {
        offenders.push(path.relative(root, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}
