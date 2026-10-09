import type { Area, Interactive, Point } from "./types";
export type { Area, AvatarState, Interactive, Obstacle, Point } from "./types";
export { transition } from "./fsm";
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.z - b.z);
export function cameraDirection(x: number, z: number): Point {
  const n = Math.hypot(x, z) || 1;
  return { x: (x + z) / Math.SQRT2 / n, z: (z - x) / Math.SQRT2 / n };
}
export const inArea = (p: Point, a: Area) =>
  p.x > a.minX && p.x < a.maxX && p.z > a.minZ && p.z < a.maxZ;
/** Closest object whose access point is within its radius, without allocating. */
export function nearest(p: Point, objects: Interactive[]) {
  let best: Interactive | undefined,
    bestDistance = Infinity;
  for (const o of objects) {
    const d = distance(p, o.approach);
    if (d < o.radius && d < bestDistance) {
      best = o;
      bestDistance = d;
    }
  }
  return best;
}
export function readSaved<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(`cozy:${key}`);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`cozy:${key}`, JSON.stringify(value));
  } catch {
    /* Storage may be disabled. */
  }
}
