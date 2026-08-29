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

Covers: happy path (`print("ok")`), timeout, egress block, gateway allowlist, reference/near-miss grade, env + workspace leak checks.

## Sign-off

| Role | Name | Date | Notes |
|---|---|---|---|
| Engineering lead | | | gVisor path approved for beta |
| Security reviewer | | | Escape / egress review complete |

**Status:** Step 5 wired — hidden eval and secrets stay off the sandbox mount (items 9–10 automated). Remaining items are manual / gVisor-host checks.
