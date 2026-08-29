const SIMULATORS = new Set([
  'rag',
  'evaluation',
  'guardrails',
  'prompt_engineering',
]);

const DIFFICULTIES = new Set(['E', 'M', 'H']);

const ARCHETYPES = new Set([
  'rag-r1',
  'rag-r2',
  'rag-r3',
  'rag-r4',
  'rag-sandbox',
  'pe-p1',
  'eval-e1',
  'eval-e2',
  'eval-e3',
  'guard-g1',
  'guard-g2',
  'guard-g3',
]);

export function validateMeta(meta, slugDir) {
  const errors = [];
  const slug = pathBasename(slugDir);

  if (meta.slug !== slug) {
    errors.push(`slug mismatch: meta.slug=${meta.slug} dir=${slug}`);
  }
  if (!SIMULATORS.has(meta.simulator)) {
    errors.push(`invalid simulator: ${meta.simulator}`);
  }
  if (!DIFFICULTIES.has(meta.difficulty)) {
    errors.push(`invalid difficulty: ${meta.difficulty}`);
  }
  if (typeof meta.version !== 'number' || meta.version < 1) {
    errors.push('version must be a positive integer');
  }
  if (!meta.graderArchetype || !ARCHETYPES.has(meta.graderArchetype)) {
    errors.push(`missing or invalid graderArchetype: ${meta.graderArchetype}`);
  }
  if (!meta.title || !meta.briefMd || !meta.submissionSchema) {
    errors.push('title, briefMd, and submissionSchema are required');
  }
  if (!Array.isArray(meta.skills) || meta.skills.length === 0) {
    errors.push('skills must be a non-empty array');
  }
  if (!Array.isArray(meta.gates) || meta.gates.length === 0) {
    errors.push('gates must be a non-empty array');
  }
  return errors;
}

function pathBasename(dir) {
  return dir.replace(/[/\\]$/, '').split(/[/\\]/).pop() ?? dir;
}
