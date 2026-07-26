import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { UsageQuota } from '../src/modules/subscriptions/usageQuota.model';
import { buildDockerArgs, DockerSandboxProvider } from '../src/modules/labs/sandbox/docker.provider';
import { executeCode } from '../src/modules/labs/code-execution/codeExec.sandbox';
import type { SandboxProvider, SandboxResult, SandboxSpec } from '../src/modules/labs/sandbox/types';
import * as soc from '../src/modules/labs/soc-simulator/soc.service';
import { SOC_SCENARIOS } from '../src/modules/labs/soc-simulator/soc.scenarios';
import * as network from '../src/modules/labs/network-simulator/network.service';
import { runCommand, DEFAULT_CWD } from '../src/modules/labs/terminal-simulator/terminal.sandbox';
import { redis } from '../src/config/redis';

let DOCKER = false;
try {
  execSync('docker version', { stdio: 'ignore', timeout: 8000 });
  DOCKER = true;
} catch {
  DOCKER = false;
}

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_labs';
const uid = (): string => new mongoose.Types.ObjectId().toString();
const utcDay = (): Date => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const spec = (o: Partial<SandboxSpec> = {}): SandboxSpec => ({
  image: 'alpine:latest',
  argv: ['sh', '-c', 'echo hello'],
  timeoutMs: 10_000,
  memoryMb: 128,
  cpus: 0.5,
  pidsLimit: 64,
  maxOutputBytes: 65_536,
  ...o,
});

const baseResult: SandboxResult = {
  stdout: 'ok',
  stderr: '',
  exitCode: 0,
  timedOut: false,
  oom: false,
  launchFailed: false,
  durationMs: 5,
};
function makeFake(over: Partial<SandboxResult> = {}) {
  let calls = 0;
  const provider: SandboxProvider = {
    run: async () => {
      calls += 1;
      return { ...baseResult, ...over };
    },
  };
  return { provider, calls: () => calls };
}

import { parseAuthCookies } from './helpers/authCookies';

async function signup(email = 'lab@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const cookies = parseAuthCookies(res);
  return { token: cookies.access, userId: res.body.user.id as string };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await UsageQuota.init();
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    UsageQuota.deleteMany({}),
  ]);
  const keys = await redis.keys('rl:*');
  if (keys.length) await redis.del(...keys);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
  if (DOCKER) {
    try {
      execSync('docker ps -aq --filter name=b2c-lab- | xargs -r docker rm -f', {
        stdio: 'ignore',
        timeout: 15_000,
      });
    } catch {
      /* best-effort cleanup */
    }
  }
});

describe('sandbox hardening (buildDockerArgs)', () => {
  it('applies every isolation flag', () => {
    const args = buildDockerArgs('b2c-lab-test', spec({ memoryMb: 256, cpus: 1, pidsLimit: 32 }));
    const joined = args.join(' ');
    expect(joined).toContain('--rm');
    expect(joined).toContain('--network none');
    expect(joined).toContain('--memory 256m');
    expect(joined).toContain('--memory-swap 256m'); // swap disabled
    expect(joined).toContain('--cpus 1');
    expect(joined).toContain('--pids-limit 32');
    expect(joined).toContain('--read-only');
    expect(joined).toContain('--cap-drop ALL');
    expect(joined).toContain('--security-opt no-new-privileges');
    expect(joined).toContain('--user 65534:65534');
    expect(joined).toContain('--tmpfs /tmp:rw,noexec,nosuid,size=16m');
  });

  it('appends the image and argv last', () => {
    const args = buildDockerArgs('n', spec({ image: 'alpine:latest', argv: ['sh', '-c', 'echo hi'] }));
    expect(args.slice(-4)).toEqual(['alpine:latest', 'sh', '-c', 'echo hi']);
  });
});

describe.skipIf(!DOCKER)('live docker sandbox (§9g breakout attempts)', () => {
  const docker = new DockerSandboxProvider();

  it('runs trusted code and captures stdout, then tears down', async () => {
    const res = await docker.run(spec({ argv: ['sh', '-c', 'echo sandbox-works'] }));
    expect(res.stdout).toContain('sandbox-works');
    expect(res.exitCode).toBe(0);
    expect(res.timedOut).toBe(false);
  }, 30_000);

  it('blocks network egress (--network none)', async () => {
    const res = await docker.run(
      spec({ argv: ['sh', '-c', 'wget -T 2 -q -O- http://93.184.216.34 || echo BLOCKED'] }),
    );
    expect(res.stdout).toContain('BLOCKED');
  }, 30_000);

  it('kills an infinite loop at the timeout (no hang)', async () => {
    const res = await docker.run(spec({ argv: ['sh', '-c', 'while true; do :; done'], timeoutMs: 2500 }));
    expect(res.timedOut).toBe(true);
  }, 30_000);

  it('enforces a read-only root filesystem', async () => {
    const res = await docker.run(
      spec({ argv: ['sh', '-c', 'echo x > /evil 2>/dev/null || echo READONLY'] }),
    );
    expect(res.stdout).toContain('READONLY');
  }, 30_000);

  it('caps captured output to maxOutputBytes', async () => {
    const res = await docker.run(
      spec({ argv: ['sh', '-c', 'yes 2>/dev/null | head -c 500000'], maxOutputBytes: 200 }),
    );
    expect(Buffer.byteLength(res.stdout, 'utf8')).toBeLessThanOrEqual(200);
  }, 30_000);

  it('contains a fork bomb via --pids-limit (host survives)', async () => {
    const res = await docker.run(
      spec({
        argv: ['sh', '-c', 'i=0; while [ $i -lt 5000 ]; do sleep 30 & i=$((i+1)); done; wait'],
        timeoutMs: 3000,
        pidsLimit: 32,
      }),
    );
    // The pid cap stops unbounded process creation: the call returns and the host
    // stays responsive (test completes) rather than hanging or being taken down.
    expect(res).toBeDefined();
    expect(res.timedOut || res.exitCode !== 0).toBe(true);
  }, 30_000);
});

describe('executeCode (orchestration + lab quota)', () => {
  it('validates, charges a lab quota unit, and runs via the provider', async () => {
    const userId = uid();
    const { provider, calls } = makeFake({ stdout: 'hi\n' });
    const res = await executeCode(userId, 'free', { language: 'shell', code: 'echo hi' }, provider);
    expect(res.stdout).toBe('hi\n');
    expect(calls()).toBe(1);
    const q = await UsageQuota.findOne({ userId });
    expect((q!.counts as unknown as Record<string, number>).labExecutions).toBe(1);
  });

  it('rejects an unsupported language (400) without running anything', async () => {
    const { provider, calls } = makeFake();
    await expect(
      executeCode(uid(), 'free', { language: 'ruby', code: 'x' }, provider),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(calls()).toBe(0);
  });

  it('rejects oversize code (413)', async () => {
    const { provider, calls } = makeFake();
    const big = 'a'.repeat(70_000);
    await expect(
      executeCode(uid(), 'free', { language: 'shell', code: big }, provider),
    ).rejects.toMatchObject({ statusCode: 413 });
    expect(calls()).toBe(0);
  });

  it('rejects once the daily lab quota is exhausted (429), without running', async () => {
    const userId = uid();
    await UsageQuota.create({
      userId,
      period: 'daily',
      periodStart: utcDay(),
      counts: {
        courseGenerations: 0,
        exerciseGenerations: 0,
        quizGenerations: 0,
        examGenerations: 0,
        labExecutions: 100, // free labExecutionsPerDay
      },
    });
    const { provider, calls } = makeFake();
    await expect(
      executeCode(userId, 'free', { language: 'shell', code: 'echo hi' }, provider),
    ).rejects.toMatchObject({ statusCode: 429 });
    expect(calls()).toBe(0);
  });

  it('passes timeout/OOM results through without throwing', async () => {
    const { provider } = makeFake({ timedOut: true, exitCode: null });
    const res = await executeCode(uid(), 'free', { language: 'shell', code: 'x' }, provider);
    expect(res.timedOut).toBe(true);
  });

  it('refunds the lab unit and 503s when the container fails to launch', async () => {
    const userId = uid();
    const { provider, calls } = makeFake({ launchFailed: true, exitCode: null, stdout: '' });
    await expect(
      executeCode(userId, 'free', { language: 'shell', code: 'echo hi' }, provider),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(calls()).toBe(1); // it did attempt to run
    const q = await UsageQuota.findOne({ userId });
    expect((q!.counts as unknown as Record<string, number>).labExecutions).toBe(0); // charged then refunded
  });
});

describe('POST /labs/code/execute', () => {
  it('401s without a token', async () => {
    const res = await request(app).post('/labs/code/execute').send({ language: 'shell', code: 'echo hi' });
    expect(res.status).toBe(401);
  });

  it('400s an invalid language (schema validation)', async () => {
    const { token } = await signup();
    const res = await request(app)
      .post('/labs/code/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'ruby', code: 'puts 1' });
    expect(res.status).toBe(400);
  });

  it('429s when the lab quota is exhausted (no container launched)', async () => {
    const { token, userId } = await signup();
    await UsageQuota.create({
      userId,
      period: 'daily',
      periodStart: utcDay(),
      counts: {
        courseGenerations: 0,
        exerciseGenerations: 0,
        quizGenerations: 0,
        examGenerations: 0,
        labExecutions: 100,
      },
    });
    const res = await request(app)
      .post('/labs/code/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'shell', code: 'echo hi' });
    expect(res.status).toBe(429);
  });

  it.skipIf(!DOCKER)('executes end-to-end via a real container', async () => {
    const { token } = await signup();
    const res = await request(app)
      .post('/labs/code/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'shell', code: 'echo e2e-ok' });
    expect(res.status).toBe(200);
    expect(res.body.result.stdout).toContain('e2e-ok');
  }, 30_000);
});

describe('SOC simulator', () => {
  it('serves a scenario without leaking expected answers', () => {
    const s = soc.getScenario('phishing-triage');
    expect(s.questions.length).toBeGreaterThan(0);
    for (const q of s.questions) {
      expect(q).not.toHaveProperty('expected');
      expect(q.prompt).toBeTruthy();
    }
  });

  it('404s an unknown scenario', () => {
    expect(() => soc.getScenario('does-not-exist')).toThrow();
  });

  it('scores a fully-correct submission at 100', () => {
    const sc = SOC_SCENARIOS['phishing-triage'];
    const answers = sc.questions.map((q) => ({ questionId: q.id, answer: q.expected[0] }));
    const r = soc.submitScenario('phishing-triage', answers);
    expect(r.score).toBe(100);
    expect(r.correct).toBe(sc.questions.length);
  });

  it('never leaks expected answers for unanswered/incorrect questions (no harvesting)', () => {
    const r = soc.submitScenario('phishing-triage', [{ questionId: 'q1', answer: 'wrong' }]);
    for (const res of r.results) {
      expect(res.correct).toBe(false);
      expect(res.expected).toBeUndefined();
    }
  });

  it('reveals the expected answer only for correctly-answered questions', () => {
    const sc = SOC_SCENARIOS['phishing-triage'];
    const r = soc.submitScenario('phishing-triage', [
      { questionId: 'q1', answer: sc.questions[0].expected[0] },
    ]);
    const q1 = r.results.find((x) => x.questionId === 'q1')!;
    expect(q1.correct).toBe(true);
    expect(q1.expected).toBe(sc.questions[0].expected[0]);
    expect(r.results.find((x) => x.questionId === 'q2')!.expected).toBeUndefined();
  });

  it('matches case-insensitively / trimmed and scores partial credit', () => {
    const sc = SOC_SCENARIOS['phishing-triage'];
    const answers = sc.questions.map((q, i) =>
      i === 0
        ? { questionId: q.id, answer: `  ${q.expected[0].toUpperCase()} ` } // still correct
        : { questionId: q.id, answer: 'totally-wrong' },
    );
    const r = soc.submitScenario('phishing-triage', answers);
    expect(r.correct).toBe(1);
    expect(r.score).toBeLessThan(100);
  });

  it('exposes list + GET + submit over HTTP', async () => {
    const { token } = await signup();
    const list = await request(app).get('/labs/soc/scenarios').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.scenarios.length).toBeGreaterThan(0);

    const get = await request(app)
      .get('/labs/soc/scenario/phishing-triage')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.scenario.questions[0].expected).toBeUndefined();

    const submit = await request(app)
      .post('/labs/soc/scenario/phishing-triage/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: [{ questionId: 'q1', answer: 'paypa1.com' }] });
    expect(submit.status).toBe(200);
    expect(submit.body.result.results[0].correct).toBe(true);
  });
});

describe('Network simulator', () => {
  it('serves a scenario without leaking expected answers', () => {
    const s = network.getScenario('port-scan');
    for (const q of s.questions) expect(q).not.toHaveProperty('expected');
  });

  it('scores a fully-correct submission at 100', () => {
    const answers = [
      { questionId: 'q1', answer: '10.0.0.5' },
      { questionId: 'q2', answer: '10.0.0.20' },
      { questionId: 'q3', answer: 'port scan' },
    ];
    expect(network.submitScenario('port-scan', answers).score).toBe(100);
  });

  it('404s an unknown scenario', () => {
    expect(() => network.getScenario('nope')).toThrow();
  });
});

describe('terminal simulator (emulated, no real execution)', () => {
  it('supports the whitelisted commands', () => {
    expect(runCommand({ cwd: DEFAULT_CWD }, 'pwd').output).toBe(DEFAULT_CWD);
    expect(runCommand({ cwd: DEFAULT_CWD }, 'whoami').output).toBe('analyst');
    expect(runCommand({ cwd: DEFAULT_CWD }, 'echo hello world').output).toBe('hello world');
    expect(runCommand({ cwd: DEFAULT_CWD }, 'ls').output).toContain('readme.txt');
    expect(runCommand({ cwd: DEFAULT_CWD }, 'cat readme.txt').output).toContain('Welcome');
  });

  it('changes directory within the virtual fs', () => {
    const cd = runCommand({ cwd: DEFAULT_CWD }, 'cd logs');
    expect(cd.cwd).toBe('/home/analyst/logs');
    expect(runCommand({ cwd: cd.cwd }, 'ls').output).toContain('auth.log');
  });

  it('refuses non-whitelisted commands (no execution)', () => {
    for (const bad of ['rm -rf /', 'curl http://evil.com', 'python -c "1"', 'wget x', 'bash']) {
      const r = runCommand({ cwd: DEFAULT_CWD }, bad);
      expect(r.error).toBe(true);
      expect(r.output).toContain('command not found');
    }
  });

  it('parses quoted arguments (strips quotes, keeps spaces)', () => {
    expect(runCommand({ cwd: DEFAULT_CWD }, 'echo "hello world"').output).toBe('hello world');
    expect(runCommand({ cwd: DEFAULT_CWD }, "echo 'a b c'").output).toBe('a b c');
    expect(runCommand({ cwd: DEFAULT_CWD }, 'cat "readme.txt"').output).toContain('Welcome');
  });

  it('handles error edge cases correctly', () => {
    expect(runCommand({ cwd: DEFAULT_CWD }, 'cd readme.txt').error).toBe(true); // not a directory
    expect(runCommand({ cwd: DEFAULT_CWD }, 'cat logs').error).toBe(true); // is a directory
    expect(runCommand({ cwd: DEFAULT_CWD }, 'ls nope').error).toBe(true); // no such file
    expect(runCommand({ cwd: DEFAULT_CWD }, 'cat').error).toBe(true); // missing operand
    expect(runCommand({ cwd: DEFAULT_CWD }, '   ').output).toBe(''); // empty command
  });

  it('clamps path traversal inside the virtual fs (cannot escape to the host)', () => {
    // Resolves to the virtual /etc/motd, never a real host file.
    const cat = runCommand({ cwd: DEFAULT_CWD }, 'cat ../../../../../../etc/motd');
    expect(cat.output).toContain('Authorized training');
    const cd = runCommand({ cwd: DEFAULT_CWD }, 'cd ../../../../..');
    expect(cd.cwd).toBe('/'); // clamped at root
  });

  it('runs over HTTP', async () => {
    const { token } = await signup();
    const res = await request(app)
      .post('/labs/terminal/command')
      .set('Authorization', `Bearer ${token}`)
      .send({ command: 'pwd' });
    expect(res.status).toBe(200);
    expect(res.body.output).toBe(DEFAULT_CWD);
  });
});
