import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  SANDBOX_NEAR_MISS_PAYLOAD,
  SANDBOX_REFERENCE_PAYLOAD,
} from '../catalogue/exercises/exercises.constants';
import { gradeSandboxRetriever } from '../grading/harnesses/sandbox/sandbox.grade';
import type { CorpusDoc } from '../grading/harnesses/rag/chunking';
import type { HiddenItem } from '../grading/harnesses/rag/rag.types';
import { SANDBOX_DEFAULTS, SANDBOX_ERROR_CODES } from './sandbox.constants';
import {
  dockerImageExists,
  ensureSandboxImage,
  runSandboxJob,
} from './sandbox.runner';

const execFileAsync = promisify(execFile);
const integrationEnabled = process.env.SANDBOX_INTEGRATION === '1';

async function dockerAvailable(): Promise<boolean> {
  try {
    await execFileAsync('docker', ['info']);
    return true;
  } catch {
    return false;
  }
}

const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('sandbox integration', () => {
  const allowRuncFallback = process.env.SANDBOX_ALLOW_RUNC_FALLBACK === 'true';
  const repoRoot = path.join(process.cwd(), '../..');
  const dockerfileDir = path.join(repoRoot, 'infra/sandbox');

  beforeAll(async () => {
    if (!(await dockerAvailable())) {
      throw new Error('Docker is required for SANDBOX_INTEGRATION tests');
    }
    await execFileAsync(
      'docker',
      [
        'compose',
        '-f',
        path.join(repoRoot, 'docker-compose.yml'),
        'up',
        '-d',
        'sandbox-gateway',
      ],
      {
        cwd: repoRoot,
      },
    );
    if (!(await dockerImageExists(SANDBOX_DEFAULTS.image))) {
      await execFileAsync('docker', [
        'build',
        '-t',
        SANDBOX_DEFAULTS.image,
        dockerfileDir,
      ]);
    }
  }, 120_000);

  it('runs print("ok") under sandbox limits', async () => {
    const result = await runSandboxJob({
      source: 'print("ok")',
      allowRuncFallback,
    });

    expect(result.ok).toBe(true);
    expect(result.errorCode).toBe(SANDBOX_ERROR_CODES.OK);
    expect(result.stdout.trim()).toBe('ok');
    expect(result.durationMs).toBeLessThan(
      (SANDBOX_DEFAULTS.maxWallClockS + 5) * 1000,
    );
  }, 60_000);

  it('kills runaway jobs with sandbox_timeout', async () => {
    const result = await runSandboxJob({
      source: 'while True:\n    pass',
      maxWallClockS: 2,
      allowRuncFallback,
    });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(SANDBOX_ERROR_CODES.TIMEOUT);
  }, 30_000);

  it('blocks outbound network except the gateway stub', async () => {
    const blocked = await runSandboxJob({
      source: `import urllib.request
try:
    urllib.request.urlopen("http://example.com/", timeout=3)
    print("leaked")
except Exception:
    print("blocked")`,
      allowRuncFallback,
    });
    expect(blocked.stdout.trim()).toBe('blocked');

    const allowed = await runSandboxJob({
      source: `import os, urllib.request
url = os.environ["SANDBOX_GATEWAY_URL"]
body = urllib.request.urlopen(url, timeout=3).read().decode()
print(body.strip())`,
      allowRuncFallback,
    });
    expect(allowed.ok).toBe(true);
    expect(allowed.stdout.trim()).toBe('ok');
  }, 60_000);

  it('grades the python retriever reference inside the sandbox', async () => {
    const dir = path.join(
      process.cwd(),
      'content/exercises/rag-009-python-retriever',
    );
    const docs = JSON.parse(
      readFileSync(path.join(dir, 'corpus.json'), 'utf8'),
    ) as CorpusDoc[];
    const hidden = JSON.parse(
      readFileSync(path.join(dir, 'eval_hidden.json'), 'utf8'),
    ) as HiddenItem[];

    const passed = await gradeSandboxRetriever(
      SANDBOX_REFERENCE_PAYLOAD,
      docs,
      hidden,
      [],
      (input) => runSandboxJob({ ...input, allowRuncFallback }),
    );
    expect(passed.verdict).toBe('pass');
    expect(passed.trace.sandbox.durationMs).toBeGreaterThan(0);
    expect(JSON.stringify(passed)).not.toContain('HIDDEN_EVAL');

    const missed = await gradeSandboxRetriever(
      SANDBOX_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      [],
      (input) => runSandboxJob({ ...input, allowRuncFallback }),
    );
    expect(missed.verdict).toBe('fail');

    const leaked = await gradeSandboxRetriever(
      {
        source: `import os, json
from pathlib import Path
print(json.dumps({
  "results": [],
  "env": dict(os.environ),
  "files": [p.name for p in Path(".").iterdir()],
}))`,
      },
      docs,
      hidden,
      [],
      (input) => runSandboxJob({ ...input, allowRuncFallback }),
    );
    const dump = JSON.stringify(leaked);
    expect(dump).not.toContain('HIDDEN_EVAL');
    expect(dump).not.toContain('DATABASE_URL');
    expect(dump).not.toContain('JWT_ACCESS_SECRET');
    expect(dump).not.toContain('eval_hidden');
  }, 120_000);

  it('builds the sandbox image when missing', async () => {
    const tag = 'labpath-sandbox:integration-tmp';
    await execFileAsync('docker', ['rmi', '-f', tag]).catch(() => undefined);
    await ensureSandboxImage(tag, dockerfileDir);
    expect(await dockerImageExists(tag)).toBe(true);
    await execFileAsync('docker', ['rmi', '-f', tag]).catch(() => undefined);
  }, 120_000);
});
