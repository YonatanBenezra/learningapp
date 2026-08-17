export type Vec3 = { x: number; y: number; z: number };

export const HERO_NODE_COUNT = 42;
export const HERO_RADIUS = 2.02;
export const HERO_LINK_DISTANCE = 1.32;

export function fibonacciSphere(count: number, radius: number): Vec3[] {
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const last = Math.max(count - 1, 1);

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / last) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    points.push({
      x: Math.cos(theta) * ring * radius,
      y: y * radius,
      z: Math.sin(theta) * ring * radius,
    });
  }

  return points;
}

function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function flattenNodes(nodes: Vec3[]): Float32Array {
  const out = new Float32Array(nodes.length * 3);
  nodes.forEach((node, index) => {
    out[index * 3] = node.x;
    out[index * 3 + 1] = node.y;
    out[index * 3 + 2] = node.z;
  });
  return out;
}

export function collectLinkPositions(nodes: Vec3[], maxDistance: number): Float32Array {
  const pairs: number[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (distance(nodes[i], nodes[j]) < maxDistance) {
        const a = nodes[i];
        const b = nodes[j];
        pairs.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
  }

  return new Float32Array(pairs);
}

export function buildHeroNetwork() {
  const nodes = fibonacciSphere(HERO_NODE_COUNT, HERO_RADIUS);
  return {
    nodes,
    nodePositions: flattenNodes(nodes),
    linkPositions: collectLinkPositions(nodes, HERO_LINK_DISTANCE),
  };
}
