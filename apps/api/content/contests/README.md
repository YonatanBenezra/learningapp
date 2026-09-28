# Timed contests

Add one JSON file per season (see the former `dogfood-s1` shape in git history).

After editing, run ingest so `isPublished` stays in sync:

```bash
node scripts/content/ingest-local.mjs
```

Verified assessments live under `content/assessments/` and use the assessments API — not this folder.
