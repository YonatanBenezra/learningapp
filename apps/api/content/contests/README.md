# Timed contests

Phased LeetCode-style product plan: [LeetCode-Style-Contests-Phases.md](../../../docs/specification/LeetCode-Style-Contests-Phases.md).

Add one JSON file per season (see the former `dogfood-s1` shape in git history).

**Weekly (LeetCode-style):** `weekly-advanced-1.json` — only published timed contest; same 15 advanced slugs for every entrant. Manifest: `../collections/core-15.json` (`contestSlug`). Old slugs (`core-15-championship`, `iron-gate-marathon`) removed — ingest unpublishes them in DB.

After editing, run ingest so `isPublished` stays in sync:

```bash
npm run content:seed-core-15 -w @labpath/api
# or full catalogue:
node scripts/content/ingest-local.mjs
```

Verified assessments live under `content/assessments/` and use the assessments API — not this folder.
