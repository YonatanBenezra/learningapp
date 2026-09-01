#!/usr/bin/env node
/**
 * Live user-journey smoke against running API (localhost:3001).
 * Usage: node scripts/user-journey-smoke.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:3001';
const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const email = `qa-user-${Date.now()}@labpath.test`;

const issues = [];
const ok = [];

function note(severity, area, message) {
  issues.push({ severity, area, message });
}
function pass(area, message) {
  ok.push({ area, message });
}

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}

function cookieFrom(setCookie) {
  if (!setCookie) return '';
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  return parts.map((c) => c.split(';')[0]).join('; ');
}

async function waitForRun(cookies, runId) {
  for (let i = 0; i < 120; i += 1) {
    const r = await api(`/api/runs/${runId}`, {
      headers: { Cookie: cookies },
    });
    if (r.body?.status === 'succeeded' || r.body?.status === 'failed') {
      return r.body;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`run ${runId} timed out`);
}

async function main() {
  console.log('=== LabPath user journey smoke ===\n');

  // Health
  const health = await api('/api/health');
  if (health.status !== 200) note('high', 'infra', 'API health failed');
  else pass('infra', 'API health OK');

  const ready = await api('/api/health/ready');
  if (ready.status !== 200) note('high', 'infra', 'API readiness failed (DB/Redis?)');
  else pass('infra', 'API readiness OK');

  // Auth
  const ml = await api('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (ml.status !== 201 || !ml.body?.token) {
    note('blocker', 'auth', `Magic link request failed (${ml.status})`);
    return printReport();
  }
  pass('auth', 'Magic link issued');

  const consume = await api('/api/auth/magic-link/consume', {
    method: 'POST',
    body: JSON.stringify({ token: ml.body.token }),
  });
  const cookies = cookieFrom(consume.headers.getSetCookie?.() ?? []);
  if (consume.status !== 201 || !cookies) {
    note('blocker', 'auth', 'Magic link consume failed');
    return printReport();
  }
  pass('auth', 'Signed in via magic link');

  const me = await api('/api/me', { headers: { Cookie: cookies } });
  if (me.status !== 200) note('high', 'auth', '/me failed after sign-in');
  else pass('auth', `User tier: ${me.body?.account?.tier ?? 'unknown'}`);

  // Catalogue
  const cat = await api('/api/exercises?pageSize=200', {
    headers: { Cookie: cookies },
  });
  const count = cat.body?.items?.length ?? 0;
  if (cat.status !== 200) note('high', 'catalogue', 'Exercise list failed');
  else if (count < 150) note('medium', 'catalogue', `Only ${count} exercises (expected 150)`);
  else pass('catalogue', `${count} exercises listed`);

  const slugs = (cat.body?.items ?? []).map((i) => i.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) note('medium', 'catalogue', `Duplicate slugs: ${dupes.slice(0, 3).join(', ')}`);

  const simulators = new Set((cat.body?.items ?? []).map((i) => i.simulator));
  for (const sim of ['rag', 'prompt_engineering', 'evaluation', 'guardrails', 'agent', 'benchmark']) {
    if (!simulators.has(sim)) note('medium', 'catalogue', `Missing simulator band: ${sim}`);
  }

  if (JSON.stringify(cat.body).includes('HIDDEN_EVAL')) {
    note('blocker', 'security', 'HIDDEN_EVAL leaked in catalogue response');
  } else pass('security', 'No canary in catalogue JSON');

  // Exercise detail
  const detail = await api('/api/exercises/rag-001-chunk-it-right', {
    headers: { Cookie: cookies },
  });
  if (detail.status !== 200) note('high', 'catalogue', 'Exercise detail failed for R1');
  else if (JSON.stringify(detail.body).includes('HIDDEN_EVAL')) {
    note('blocker', 'security', 'HIDDEN_EVAL in exercise detail');
  } else pass('catalogue', 'R1 detail loads without hidden eval');

  // R1 submit flow (minimal valid payload from near-miss structure - use onboarding starter if needed)
  const r1Payload = {
    chunkSize: 400,
    chunkOverlap: 80,
    topK: 4,
  };

  const attempt = await api('/api/attempts', {
    method: 'POST',
    headers: { Cookie: cookies },
    body: JSON.stringify({ exerciseSlug: 'rag-001-chunk-it-right' }),
  });
  if (attempt.status !== 201) {
    note('high', 'practice', `Start attempt failed (${attempt.status}): ${JSON.stringify(attempt.body)}`);
  } else {
    pass('practice', 'Attempt started for R1');
    const sub = await api(`/api/attempts/${attempt.body.id}/submissions`, {
      method: 'POST',
      headers: { Cookie: cookies },
      body: JSON.stringify({ payload: r1Payload }),
    });
    if (sub.status !== 201) {
      note('high', 'practice', `Submission failed (${sub.status})`);
    } else {
      const run = await waitForRun(cookies, sub.body.runId);
      if (run.status !== 'succeeded') {
        note('high', 'practice', `Run ended ${run.status}: ${run.errorMessage ?? ''}`);
      } else {
        pass('practice', 'R1 submission graded');
        const grade = await api(`/api/runs/${sub.body.runId}/grade`, {
          headers: { Cookie: cookies },
        });
        const trace = await api(`/api/runs/${sub.body.runId}/trace`, {
          headers: { Cookie: cookies },
        });
        if (grade.status !== 200) note('medium', 'practice', 'Grade endpoint failed');
        else {
          pass('practice', `R1 verdict: ${grade.body?.verdict}`);
          if (JSON.stringify(grade.body).includes('HIDDEN_EVAL')) {
            note('blocker', 'security', 'HIDDEN_EVAL in grade JSON');
          }
        }
        if (trace.status !== 200) note('medium', 'practice', 'Trace endpoint failed');
        else if (JSON.stringify(trace.body).includes('HIDDEN_EVAL')) {
          note('blocker', 'security', 'HIDDEN_EVAL in trace JSON');
        } else pass('practice', 'Trace loads without leak');
      }
    }
  }

  // Paths
  const paths = await api('/api/paths', { headers: { Cookie: cookies } });
  if (paths.status !== 200) note('medium', 'paths', 'Paths list failed');
  else {
    const names = (paths.body?.items ?? paths.body ?? []).map?.((p) => p.slug) ?? [];
    pass('paths', `Paths: ${names.length ? names.join(', ') : 'loaded'}`);
    if (!names.some((s) => String(s).includes('rag'))) {
      note('low', 'paths', 'rag-fundamentals path not obvious in list');
    }
  }

  // Contests (free user)
  const contests = await api('/api/contests', { headers: { Cookie: cookies } });
  if (contests.status !== 200) note('medium', 'contests', 'Contests list failed');
  else {
    pass('contests', `Contests listed: ${(contests.body?.items ?? []).length}`);
    const enter = await api('/api/contests/dogfood-s1/enter', {
      method: 'POST',
      headers: { Cookie: cookies },
    });
    if (enter.status === 201) {
      note('low', 'contests', 'Free user could enter contest (expected Pro gate?)');
    } else if (enter.status === 403 || enter.status === 402 || enter.status === 400) {
      pass('contests', 'Free user blocked from contest enter (expected)');
    }
  }

  // Leaderboard
  const lb = await api('/api/leaderboard', { headers: { Cookie: cookies } });
  if (lb.status !== 200) note('medium', 'leaderboard', 'Leaderboard failed');
  else pass('leaderboard', `Leaderboard rows: ${(lb.body?.items ?? lb.body?.entries ?? []).length ?? 'ok'}`);

  // Progress
  const prog = await api('/api/me/progress', { headers: { Cookie: cookies } });
  if (prog.status !== 200) note('medium', 'progress', 'Progress failed');
  else pass('progress', 'Progress endpoint OK');

  // Web pages (HTML smoke)
  const pages = [
    '/',
    '/login',
    '/catalogue',
    '/paths',
    '/contests',
    '/leaderboard',
    '/progress',
    '/billing',
    '/onboarding',
    '/exercises/rag-001-chunk-it-right',
  ];
  for (const path of pages) {
    try {
      const res = await fetch(`${WEB}${path}`, { redirect: 'follow' });
      if (res.status >= 500) note('high', 'web', `${path} → ${res.status}`);
      else if (res.status >= 400) note('low', 'web', `${path} → ${res.status} (may need auth)`);
      else pass('web', `${path} → ${res.status}`);
    } catch (e) {
      note('high', 'web', `${path} unreachable: ${e.message}`);
    }
  }

  printReport();
}

function printReport() {
  console.log('\n--- PASS (' + ok.length + ') ---');
  for (const row of ok) console.log(`  [${row.area}] ${row.message}`);
  console.log('\n--- ISSUES (' + issues.length + ') ---');
  for (const row of issues) console.log(`  [${row.severity}] ${row.area}: ${row.message}`);
  process.exit(issues.some((i) => i.severity === 'blocker' || i.severity === 'high') ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
