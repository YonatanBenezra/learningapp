/** True outside production builds, where the local worker hint is useful. */
export const SHOW_WORKER_DEV_HINT = process.env.NODE_ENV !== "production";

/** Plain text for inline error surfaces (submission form, contest submit). */
export const WORKER_OFFLINE_MESSAGE = SHOW_WORKER_DEV_HINT
  ? "Still queued after 30s. The grading worker may be offline — from the repo root run npm run dev (api + worker + web) or npm run dev:worker."
  : "Still queued after 30s. Grading is busier than usual: your submission is saved and will be graded as soon as a grader is free. Keep this tab open.";
