# LabPath Python sandbox (gVisor)

Isolated runtime for learner Python. Step 5 grades `rag-009-python-retriever` through `SandboxHarness` (worker materialises `main.py` + `input.json`, never `eval_hidden.json`).

Phase 2 Agent jobs reuse this image and network. Tool host: `import labpath_tools` (baked at `/opt/labpath`). Limits for Agent jobs are a **per-job override** — Phase 1 BYOC stays 30 s.

## Limits

| | Phase 1 BYOC | Agent jobs (Phase 2) |
|---|---|---|
| RAM | 512 MB | 512 MB |
| Wall clock | 30 s | **180 s** |
| PIDs | 64 | 64 |
| Filesystem | Ephemeral tmpfs; submission `:ro` | Same; no persist between steps |
| Network | Internal network; only `sandbox-gateway` | Same |
| Tools | — | `calculator`, `json_store`, `fixture_fetch` (log on stderr marker `LABPATH_TOOL_LOG:`) |

Locked in [phase-1-decisions.md](../../docs/phase-1-decisions.md) and [phase-2-decisions.md](../../docs/phase-2-decisions.md).

## Local setup

1. **Build the runner image**

```bash
docker build -t labpath-sandbox:local infra/sandbox
```

2. **Start the isolated network + gateway stub**

```bash
docker compose up -d sandbox-gateway
```

3. **Install gVisor (production path)**

```bash
# https://gvisor.dev/docs/user_guide/install/
curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | sudo tee /etc/apt/sources.list.d/gvisor.list
sudo apt-get update && sudo apt-get install -y runsc
sudo runsc install
sudo systemctl restart docker
docker run --rm --runtime=runsc hello-world
```

4. **Smoke test**

```bash
npm run sandbox:smoke -w @labpath/api
```

Set `SANDBOX_ALLOW_RUNC_FALLBACK=true` for dev machines without gVisor (not for production).

Covers Phase 1 `print("ok")` / timeout / egress **and** Agent calculator + `fixture_fetch` / tool log / hidden-eval leak checks.

## Security review

Complete [docs/sandbox-security-checklist.md](../../docs/sandbox-security-checklist.md) (Phase 1 + Agent addendum) before wiring Agent A1 (Phase 2 Step 3).
