# Timed contests

Phased LeetCode-style product plan: [LeetCode-Style-Contests-Phases.md](../../../docs/specification/LeetCode-Style-Contests-Phases.md).

Add one JSON file per season (see the former `dogfood-s1` shape in git history).

**Weekly (CTF tryout):** `weekly-advanced-1.json` — published timed contest; fixed pool of **5 Easy + 5 Medium + 5 Hard** scenarios (`samplingMode: fixed_pool`). Scoring: `pointsPerProblem: 100` → **1500 max** (15 × 100). Manifest: `../collections/ctf-tryout-15.json`. Advanced-only pool remains documented in `../collections/core-15.json` for path/capstone reference.

### Contest JSON fields (v1)

| Field | Default | Purpose |
|-------|---------|---------|
| `samplingMode` | `per_user` | `fixed_pool` = pool order for everyone; `per_user` = seeded shuffle |
| `pointsPerProblem` | `100` | Max points per problem; sitting max = `sampleSize × pointsPerProblem` |
| `rankingIncludesActive` | `true` | Show in-progress rows on the contest leaderboard |

After editing, run ingest so `isPublished` stays in sync:

```bash
npm run content:seed-core-15 -w @labpath/api
# or full catalogue:
node scripts/content/ingest-local.mjs
```

Verified assessments live under `content/assessments/` and use the assessments API — not this folder.

**After close:** learners get **virtual practice** on the contest page (`/contests/:slug/practice/:exerciseSlug`) — practice attempts are not tied to `ContestEntry`. Hosts can download standings from `GET /api/contests/:slug/leaderboard/export.csv`.
