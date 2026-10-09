import { AVATAR_RADIUS, type Area, type Obstacle, type Point } from "./types";
import { inArea } from "./logic";
/** Inside some floor area (rooms and hallway) and clear of furniture. */
export function walkable(
  p: Point,
  obstacles: Obstacle[],
  areas: Area[],
  padding = AVATAR_RADIUS,
) {
  if (!areas.some((a) => inArea(p, a))) return false;
  for (const o of obstacles)
    if (
      Math.abs(p.x - o.x) < o.w / 2 + padding &&
      Math.abs(p.z - o.z) < o.d / 2 + padding
    )
      return false;
  return true;
}
/** Slab intersection of a segment and each inflated furniture rectangle. */
export function lineClear(
  a: Point,
  b: Point,
  obstacles: Obstacle[],
  areas: Area[],
  padding = AVATAR_RADIUS,
): boolean {
  if (!walkable(a, obstacles, areas, padding)) return false;
  if (!walkable(b, obstacles, areas, padding)) return false;
  // The whole segment must remain inside the union of floor rectangles.
  const intervals: [number, number][] = [];
  for (const area of areas) {
    let enter = 0,
      exit = 1;
    for (const axis of ["x", "z"] as const) {
      const min = axis === "x" ? area.minX : area.minZ;
      const max = axis === "x" ? area.maxX : area.maxZ;
      const delta = b[axis] - a[axis];
      if (Math.abs(delta) < 1e-9) {
        if (a[axis] < min || a[axis] > max) {
          exit = -1;
          break;
        }
      } else {
        const t1 = (min - a[axis]) / delta,
          t2 = (max - a[axis]) / delta;
        enter = Math.max(enter, Math.min(t1, t2));
        exit = Math.min(exit, Math.max(t1, t2));
      }
    }
    if (enter <= exit) intervals.push([enter, exit]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let covered = 0;
  for (const [enter, exit] of intervals) {
    if (enter > covered + 1e-9) return false;
    covered = Math.max(covered, exit);
  }
  if (covered < 1 - 1e-9) return false;
  return !obstacles.some((o) => {
    let enter = 0,
      exit = 1;
    for (const axis of ["x", "z"] as const) {
      const half = (axis === "x" ? o.w : o.d) / 2 + padding;
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
/** Slide along furniture while preserving the same occupancy rules as A*. */
export function moveKinematic(
  position: Point,
  delta: Point,
  obstacles: Obstacle[],
  areas: Area[],
): Point {
  let next = { x: position.x, z: position.z };
  const x = { x: next.x + delta.x, z: next.z };
  if (walkable(x, obstacles, areas)) next = x;
  const z = { x: next.x, z: next.z + delta.z };
  if (walkable(z, obstacles, areas)) next = z;
  return next;
}
export function smoothPath(
  start: Point,
  path: Point[],
  obstacles: Obstacle[],
  areas: Area[],
): Point[] {
  const result: Point[] = [];
  let current = start,
    index = 0;
  while (index < path.length) {
    let last = index;
    for (let i = index + 1; i < path.length; i++) {
      if (lineClear(current, path[i], obstacles, areas)) last = i;
      else break;
    }
    current = path[last];
    result.push(current);
    index = last + 1;
  }
  return result;
}
const neighbours = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;
/** Binary min-heap of cell indices ordered by an external priority array. */
class CellHeap {
  private items: { cell: number; score: number }[] = [];
  constructor(private priority: Float64Array) {}
  get size() {
    return this.items.length;
  }
  push(cell: number) {
    const items = this.items;
    // Priorities may improve while older entries are still in the heap.
    const entry = { cell, score: this.priority[cell] };
    let i = items.push(entry) - 1;
    while (i > 0) {
      const up = (i - 1) >> 1;
      if (items[up].score <= entry.score) break;
      items[i] = items[up];
      i = up;
    }
    items[i] = entry;
  }
  pop() {
    const items = this.items;
    const top = items[0],
      last = items.pop()!;
    if (items.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1,
          r = l + 1;
        let min = i;
        let best = last;
        if (l < items.length && items[l].score < best.score) {
          min = l;
          best = items[l];
        }
        if (r < items.length && items[r].score < best.score) {
          min = r;
          best = items[r];
        }
        if (min === i) break;
        items[i] = items[min];
        i = min;
      }
      items[i] = last;
    }
    return top.cell;
  }
}
/**
 * Static occupancy grid for A*. Obstacles never move, so every cell's
 * walkability is computed once; searches only read a byte per neighbour.
 */
export class NavGrid {
  readonly step = 0.4;
  private minI: number;
  private minJ: number;
  private cols: number;
  private rows: number;
  private free: Uint8Array;
  private edges: Uint8Array;
  constructor(
    readonly areas: Area[],
    readonly obstacles: Obstacle[],
  ) {
    const s = this.step;
    this.minI = Math.floor(Math.min(...areas.map((a) => a.minX)) / s) - 1;
    this.minJ = Math.floor(Math.min(...areas.map((a) => a.minZ)) / s) - 1;
    this.cols =
      Math.ceil(Math.max(...areas.map((a) => a.maxX)) / s) + 2 - this.minI;
    this.rows =
      Math.ceil(Math.max(...areas.map((a) => a.maxZ)) / s) + 2 - this.minJ;
    this.free = new Uint8Array(this.cols * this.rows);
    for (let c = 0; c < this.cols; c++)
      for (let r = 0; r < this.rows; r++) {
        const p = { x: (c + this.minI) * s, z: (r + this.minJ) * s };
        this.free[r * this.cols + c] = walkable(p, obstacles, areas) ? 1 : 0;
      }
    this.edges = new Uint8Array(this.free.length);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        const cell = r * this.cols + c;
        if (!this.free[cell]) continue;
        const i = c + this.minI,
          j = r + this.minJ;
        neighbours.forEach(([dx, dz], direction) => {
          if (
            this.isFree(i + dx, j + dz) &&
            this.isFree(i + dx, j) &&
            this.isFree(i, j + dz) &&
            this.lineClear(
              { x: i * s, z: j * s },
              { x: (i + dx) * s, z: (j + dz) * s },
            )
          )
            this.edges[cell] |= 1 << direction;
        });
      }
  }
  walkable(p: Point) {
    return walkable(p, this.obstacles, this.areas);
  }
  lineClear(a: Point, b: Point) {
    return lineClear(a, b, this.obstacles, this.areas);
  }
  move(position: Point, delta: Point) {
    return moveKinematic(position, delta, this.obstacles, this.areas);
  }
  /** Cell index for integer grid coordinates, or -1 outside the grid. */
  private cell(i: number, j: number) {
    const c = i - this.minI,
      r = j - this.minJ;
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }
  private isFree(i: number, j: number) {
    const c = this.cell(i, j);
    return c >= 0 && this.free[c] === 1;
  }
  /** Nearest grid node reachable from `point` along a straight clear line. */
  private anchor(point: Point) {
    const s = this.step,
      ci = Math.round(point.x / s),
      cj = Math.round(point.z / s);
    const candidates: { i: number; j: number; d: number }[] = [];
    for (let i = ci - 2; i <= ci + 2; i++)
      for (let j = cj - 2; j <= cj + 2; j++)
        candidates.push({
          i,
          j,
          d: Math.hypot(i * s - point.x, j * s - point.z),
        });
    candidates.sort((a, b) => a.d - b.d);
    return candidates.find(
      (c) =>
        this.isFree(c.i, c.j) &&
        this.lineClear(point, { x: c.i * s, z: c.j * s }),
    );
  }
  pathfind(start: Point, end: Point): Point[] {
    if (!this.walkable(end)) return [];
    const s = this.anchor(start),
      e = this.anchor(end);
    if (!s || !e) return [];
    const n = this.cols * this.rows,
      startCell = this.cell(s.i, s.j),
      endCell = this.cell(e.i, e.j);
    const cost = new Float64Array(n).fill(Infinity),
      score = new Float64Array(n),
      parent = new Int32Array(n).fill(-1),
      closed = new Uint8Array(n);
    const open = new CellHeap(score);
    const heuristic = (c: number) =>
      Math.hypot(
        (c % this.cols) - (endCell % this.cols),
        Math.floor(c / this.cols) - Math.floor(endCell / this.cols),
      );
    cost[startCell] = 0;
    score[startCell] = heuristic(startCell);
    open.push(startCell);
    while (open.size) {
      const p = open.pop();
      if (closed[p]) continue;
      closed[p] = 1;
      if (p === endCell)
        return this.reconstruct(start, end, parent, p, startCell);
      const pi = (p % this.cols) + this.minI,
        pj = Math.floor(p / this.cols) + this.minJ;
      for (let direction = 0; direction < neighbours.length; direction++) {
        if (!(this.edges[p] & (1 << direction))) continue;
        const [dx, dz] = neighbours[direction];
        const q = this.cell(pi + dx, pj + dz);
        if (closed[q]) continue;
        const c = cost[p] + (dx && dz ? Math.SQRT2 : 1);
        if (c < cost[q]) {
          cost[q] = c;
          parent[q] = p;
          score[q] = c + heuristic(q);
          open.push(q);
        }
      }
    }
    return [];
  }
  private reconstruct(
    start: Point,
    end: Point,
    parent: Int32Array,
    last: number,
    first: number,
  ) {
    const s = this.step,
      toPoint = (c: number) => ({
        x: ((c % this.cols) + this.minI) * s,
        z: (Math.floor(c / this.cols) + this.minJ) * s,
      });
    const out: Point[] = [end];
    for (let c = last; c !== first; c = parent[c]) out.push(toPoint(c));
    out.push(toPoint(first));
    out.reverse();
    // `end` was pushed first; after reversing it is last, as expected.
    return smoothPath(start, out, this.obstacles, this.areas);
  }
}
/** One-off search; long-lived callers should keep a `NavGrid`. */
export function pathfind(
  start: Point,
  end: Point,
  obstacles: Obstacle[],
  areas: Area[],
): Point[] {
  return new NavGrid(areas, obstacles).pathfind(start, end);
}
