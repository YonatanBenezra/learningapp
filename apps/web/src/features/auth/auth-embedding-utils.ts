/** Deterministic pseudo-random — same output on server and client. */
export function mulberry32(seed: number) {
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) | 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type EmbedPoint = {
  id: number;
  x: number;
  y: number;
  opacity: number;
};

export type EmbedLink = {
  a: number;
  b: number;
};

const PANEL_W = 560;
const PANEL_H = 720;
const POINT_COUNT = 176;

function dist(a: EmbedPoint, b: EmbedPoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function buildEmbeddingField(seed = 0x1ab7a70) {
  const rand = mulberry32(seed);
  const points: EmbedPoint[] = [];

  for (let i = 0; i < POINT_COUNT; i += 1) {
    points.push({
      id: i,
      x: 24 + rand() * (PANEL_W - 48),
      y: 24 + rand() * (PANEL_H - 48),
      opacity: 0.45 + rand() * 0.35,
    });
  }

  const linkSet = new Set<string>();
  const links: EmbedLink[] = [];

  function addLink(a: number, b: number) {
    if (a === b) return;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (linkSet.has(key)) return;
    linkSet.add(key);
    links.push({ a, b });
  }

  for (let i = 0; i < points.length; i += 1) {
    const sorted = points
      .map((p, j) => ({ j, d: i === j ? Infinity : dist(points[i], p) }))
      .sort((x, y) => x.d - y.d);
    const neighbours = 1 + (i % 3 === 0 ? 1 : 0);
    for (let n = 0; n < neighbours && n < sorted.length; n += 1) {
      addLink(i, sorted[n].j);
    }
  }

  return { points, links, width: PANEL_W, height: PANEL_H };
}

export function topNearestIds(points: EmbedPoint[], originId: number, k: number): number[] {
  const origin = points[originId];
  if (!origin) return [];
  return points
    .map((p) => ({ id: p.id, d: dist(origin, p) }))
    .filter((row) => row.id !== originId)
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((row) => row.id);
}

export function cosineLabelForQuery(seed: number) {
  const v = 0.74 + (seed % 18) * 0.01;
  return v.toFixed(2);
}

export const EMBEDDING_FIELD = buildEmbeddingField();
