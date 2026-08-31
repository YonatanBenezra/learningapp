# Sandbox security checklist (Phase 1 Step 4)

Review before wiring learner Python into the grading pipeline (Step 5). Sign-off can be lightweight internal review for public beta.

**Runtime decision:** gVisor (`runsc`) per [phase-1-decisions.md](./phase-1-decisions.md).  
**Implementation:** `apps/api/src/modules/sandbox/`, `infra/sandbox/`, isolated Docker network in `docker-compose.yml`.

| # | Control | Expected behaviour | Verified |
|---|---|---|---|
| 1 | **Kernel isolation** | Containers run with `--runtime=runsc` when gVisor is installed | [ ] |
| 2 | **Memory cap** | `--memory=512m` + swap capped; OOM → exit 137 / `sandbox_oom` | [ ] manual |
| 3 | **Wall clock** | Runner kills container after 30 s (configurable) → `sandbox_timeout` | [x] `sandbox.integration` |
| 4 | **No persistent FS** | `--read-only` root; submission mounted `:ro`; tmpfs `/tmp` only | [x] runner args |
| 5 | **Privilege drop** | Non-root `sandbox` user in image; `--cap-drop ALL`; `no-new-privileges` | [x] Dockerfile + runner |
| 6 | **PID limit** | `--pids-limit 64` mitigates fork bombs | [x] runner args |
| 7 | **Network egress** | Sandbox on `internal: true` network; only `sandbox-gateway` reachable | [x] `sandbox.integration` |
| 8 | **Gateway allowlist** | Learner code receives `SANDBOX_GATEWAY_URL` env; no other outbound routes | [x] `sandbox.integration` |
| 9 | **Hidden data** | Grader loads hidden eval on worker host; not mounted into sandbox | [x] `sandbox.grade.spec` + `assertWorkspaceSafe` |
| 10 | **Secrets** | No DB/API env vars passed into sandbox container | [x] `sandboxEnvArgs` (gateway + PYTHONUNBUFFERED only) |
| 11 | **Escape testing** | Manual: attempt host mount, `/proc` abuse, capability escalation | [ ] |
| 12 | **Resource exhaustion** | Integration test: infinite loop → timeout; fork bomb → pid limit / timeout | [ ] |

## Automated checks

```bash
docker compose up -d sandbox-gateway
docker build -t labpath-sandbox:local infra/sandbox
SANDBOX_INTEGRATION=1 SANDBOX_ALLOW_RUNC_FALLBACK=true npm run sandbox:smoke -w @labpath/api
```

Covers: happy path (`print("ok")`), timeout, egress block, gateway allowlist, reference/near-miss grade, env + workspace leak checks, Agent `labpath_tools` calculator / fixture_fetch / tool log / call ceiling.

## Agent addendum (Phase 2 Step 2)

O9: **keep gVisor**; Agent jobs **512 MB / 180 s**; Firecracker out of Phase 2. See [phase-2-decisions.md](./phase-2-decisions.md).

| # | Control | Expected behaviour | Verified |
|---|---|---|---|
| A1 | **Envelope** | Agent wall clock 180 s is a per-job override; BYOC stays 30 s | [x] `AGENT_SANDBOX_DEFAULTS` + runner spec |
| A2 | **Tool allowlist** | Only `calculator`, `json_store`, `fixture_fetch`; no shell / sockets / email | [x] `labpath_tools` + `agent-runtime.spec` |
| A3 | **Calculator** | Arithmetic AST only — no `eval` / `__import__` | [x] `agent-runtime.spec` |
| A4 | **fixture_fetch** | Path must stay on `SANDBOX_GATEWAY_URL`; `..`, `//`, absolute URLs rejected | [x] unit + `sandbox.integration` |
| A5 | **Tool log** | Host parses `LABPATH_TOOL_LOG:` on stderr (tmpfs is gone after exit); workspace stays `:ro` | [x] runner + integration |
| A6 | **Hidden eval** | `labpath_tools` / tool log files refused in workspace; log JSON has no canaries | [x] `assertWorkspaceSafe` + agent specs |
| A7 | **Call / step ceiling** | 9th step or 13th tool call → `killed_loop`; grader fails with a learner-facing message | [x] `agent-runtime.spec` + `a1.grade.spec` |
| A8 | **Secrets** | Docker env still gateway + `PYTHONUNBUFFERED` only; local python uses a tight env | [x] runner spec + agent-runtime spec |
| A9 | **No persist** | json_store is process memory; container + host workDir deleted after the job | [x] runner `finally` rm |
| A10 | **Escape / gVisor host** | Same manual bar as items 11–12 | [ ] manual |

**Status:** Agent runtime signed for Step 3 (A1 harness). Step 4: traces + loop/cost ceilings + recovery scoring. Do not raise BYOC limits. Manual gVisor-host escape remains open (same as Phase 1).

## Sign-off

| Role | Name | Date | Notes |
|---|---|---|---|
| Engineering lead | | 2026-09-01 | Phase 1 gVisor path; Phase 2 Agent addendum A1–A9 automated |
| Security reviewer | | | Escape / egress review complete |
