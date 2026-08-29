# LabPath Python sandbox (gVisor)

Isolated runtime for learner Python. Step 5 grades `rag-009-python-retriever` through `SandboxHarness` (worker materialises `main.py` + `input.json`, never `eval_hidden.json`).

## Limits (locked in phase-1-decisions.md)

| Limit | Value |
|---|---|
| RAM | 512 MB |
| Wall clock | 30 s |
| Filesystem | Ephemeral tmpfs only; submission mounted read-only |
| Network | Internal Docker network; egress only to `sandbox-gateway` |

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

## Security review

Complete [docs/sandbox-security-checklist.md](../../docs/sandbox-security-checklist.md) before wiring sandbox into grading (Step 5).
