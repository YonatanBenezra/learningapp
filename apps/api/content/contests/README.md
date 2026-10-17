# Timed contests

Add one JSON file per season (see the former `dogfood-s1` shape in git history).

**Core 15:** `core-15-championship.json` — fixed pool of 15 catalogue slugs (6 RAG + 9 Guard). Manifest: `../collections/core-15.json`. Path: `../paths/core-15-intermediate-advanced.json`.

After editing, run ingest so `isPublished` stays in sync:

```bash
npm run content:seed-core-15 -w @labpath/api
# or full catalogue:
node scripts/content/ingest-local.mjs
```

Verified assessments live under `content/assessments/` and use the assessments API — not this folder.
