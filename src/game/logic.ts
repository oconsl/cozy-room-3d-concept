export type Point = { x: number; z: number };
export type AvatarState =
  | "IDLE"
  | "WALKING"
  | "TURNING"
  | "SITTING"
  | "STANDING"
  | "WAVING"
  | "INTERACTING";
import { floorAreas } from "../world/config";
export interface Area {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
export interface Obstacle {
  x: number;
  z: number;
  w: number;
  d: number;
}
export interface Interactive {
  id: string;
  name: string;
  type: "seat" | "lamp" | "monitor" | "book" | "board" | "plant" | "radio";
  position: Point;
  approach: Point;
  radius: number;
  state: boolean;
  seat?: Point;
  angle?: number;
  /** Hip height while seated. */
  height?: number;
}
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.z - b.z);
export function cameraDirection(x: number, z: number): Point {
  const n = Math.hypot(x, z) || 1;
  return { x: (x + z) / Math.SQRT2 / n, z: (z - x) / Math.SQRT2 / n };
}
export const inArea = (p: Point, a: Area) =>
  p.x > a.minX && p.x < a.maxX && p.z > a.minZ && p.z < a.maxZ;
/** Inside some floor area (rooms and hallway) and clear of furniture. */
export function walkable(
  p: Point,
  obstacles: Obstacle[],
  padding = 0.24,
  areas: Area[] = floorAreas,
) {
  return (
    areas.some((a) => inArea(p, a)) &&
    !obstacles.some(
      (o) =>
        Math.abs(p.x - o.x) < o.w / 2 + padding &&
        Math.abs(p.z - o.z) < o.d / 2 + padding,
    )
  );
}
export function nearest(p: Point, objects: Interactive[]) {
  return objects
    .filter((o) => distance(p, o.approach) < o.radius)
    .sort((a, b) => distance(p, a.approach) - distance(p, b.approach))[0];
}
export function transition(
  state: AvatarState,
  event: "move" | "sit" | "stand" | "wave" | "interact" | "done",
): AvatarState {
  if (state === "SITTING") return event === "stand" ? "STANDING" : state;
  if (event === "done") return "IDLE";
  return (
    {
      move: "WALKING",
      sit: "SITTING",
      stand: "STANDING",
      wave: "WAVING",
      interact: "INTERACTING",
    } as const
  )[event];
}
export function pathfind(start: Point, end: Point, obs: Obstacle[]): Point[] {
  const step = 0.4;
  const snap = (p: Point) => ({
    x: Math.round(p.x / step),
    z: Math.round(p.z / step),
  });
  const anchor = (point: Point) => {
    const center = snap(point);
    const candidates: Point[] = [];
    for (let x = -2; x <= 2; x++)
      for (let z = -2; z <= 2; z++)
        candidates.push({ x: center.x + x, z: center.z + z });
    candidates.sort(
      (a, b) =>
        distance({ x: a.x * step, z: a.z * step }, point) -
        distance({ x: b.x * step, z: b.z * step }, point),
    );
    return candidates.find((p) =>
      lineClear(point, { x: p.x * step, z: p.z * step }, obs),
    );
  };
  const s = anchor(start),
    e = anchor(end);
  if (!s || !e) return [];
  const key = (p: Point) => `${p.x},${p.z}`;
  if (!walkable(end, obs)) return [];
  const open = [s],
    cost = new Map([[key(s), 0]]),
    parent = new Map<string, Point>();
  let count = 0;
  while (open.length && count++ < 4000) {
    open.sort(
      (a, b) =>
        cost.get(key(a))! +
        distance(a, e) -
        (cost.get(key(b))! + distance(b, e)),
    );
    const p = open.shift()!;
    if (key(p) === key(e)) {
      const out: Point[] = [end];
      let cur = p;
      while (key(cur) !== key(s)) {
        out.unshift({ x: cur.x * step, z: cur.z * step });
        cur = parent.get(key(cur))!;
      }
      out.unshift({ x: s.x * step, z: s.z * step });
      return smoothPath(start, out, obs);
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const q = { x: p.x + dx, z: p.z + dz };
      if (
        !walkable({ x: q.x * step, z: q.z * step }, obs) ||
        !walkable({ x: p.x * step + dx * step, z: p.z * step }, obs) ||
        !walkable({ x: p.x * step, z: p.z * step + dz * step }, obs)
      )
        continue;
      const c = cost.get(key(p))! + Math.hypot(dx, dz);
      if (c < (cost.get(key(q)) ?? Infinity)) {
        cost.set(key(q), c);
        parent.set(key(q), p);
        open.push(q);
      }
    }
  }
  return [];
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

export function smoothPath(
  start: Point,
  path: Point[],
  obstacles: Obstacle[],
): Point[] {
  const result: Point[] = [];
  let current = start,
    index = 0;
  while (index < path.length) {
    let last = index;
    for (let i = index + 1; i < path.length; i++) {
      if (lineClear(current, path[i], obstacles)) last = i;
      else break;
    }
    current = path[last];
    result.push(current);
    index = last + 1;
  }
  return result;
}

/** Slide along furniture while preserving the same occupancy rules as A*. */
export function moveKinematic(
  position: Point,
  delta: Point,
  obstacles: Obstacle[],
): Point {
  let next = { ...position };
  const x = { x: next.x + delta.x, z: next.z };
  if (walkable(x, obstacles)) next = x;
  const z = { x: next.x, z: next.z + delta.z };
  if (walkable(z, obstacles)) next = z;
  return next;
}

/** Slab intersection of a segment and each inflated furniture rectangle. */
export function lineClear(a: Point, b: Point, obstacles: Obstacle[]): boolean {
  if (!walkable(a, obstacles) || !walkable(b, obstacles)) return false;
  return !obstacles.some((o) => {
    let enter = 0,
      exit = 1;
    for (const axis of ["x", "z"] as const) {
      const half = (axis === "x" ? o.w : o.d) / 2 + 0.24;
      const min = o[axis] - half,
        max = o[axis] + half,
        delta = b[axis] - a[axis];
      if (Math.abs(delta) < 1e-9) {
        if (a[axis] <= min || a[axis] >= max) return false;
        continue;
      }
      const t1 = (min - a[axis]) / delta,
        t2 = (max - a[axis]) / delta;
      enter = Math.max(enter, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (enter >= exit) return false;
    }
    return enter < exit;
  });
}
