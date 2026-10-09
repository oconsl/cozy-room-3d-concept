import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cameraDirection,
  distance,
  nearest,
  readSaved,
  save,
  transition,
  type Interactive,
} from "../src/game/logic";
import {
  moveKinematic as move,
  pathfind as findPath,
  walkable as isWalkable,
} from "../src/game/navigation";
import { floorAreas, interactions, obstacles } from "../src/world/config";
const walkable = (
  p: Parameters<typeof isWalkable>[0],
  obstacles: Parameters<typeof isWalkable>[1],
) => isWalkable(p, obstacles, floorAreas);
const pathfind = (
  start: Parameters<typeof findPath>[0],
  end: Parameters<typeof findPath>[1],
  obstacles: Parameters<typeof findPath>[2],
) => findPath(start, end, obstacles, floorAreas);
const moveKinematic = (
  p: Parameters<typeof move>[0],
  delta: Parameters<typeof move>[1],
  obstacles: Parameters<typeof move>[2],
) => move(p, delta, obstacles, floorAreas);
afterEach(() => vi.unstubAllGlobals());
describe("movement in camera coordinates", () => {
  it("maps forward to the isometric upper direction", () => {
    const d = cameraDirection(0, -1);
    expect(d.x).toBeCloseTo(-Math.SQRT1_2);
    expect(d.z).toBeCloseTo(-Math.SQRT1_2);
  });
  it("normalizes diagonals and handles rest", () => {
    expect(Math.hypot(...Object.values(cameraDirection(1, 1)))).toBeCloseTo(1);
    expect(cameraDirection(0, 0)).toEqual({ x: 0, z: 0 });
  });
  it("rejects walls and inflated furniture bounds", () => {
    expect(walkable({ x: 6, z: 0 }, [])).toBe(false);
    expect(walkable({ x: 0, z: 0 }, [{ x: 0, z: 0, w: 1, d: 1 }])).toBe(false);
    expect(walkable({ x: 0.6, z: 0 }, [{ x: 0, z: 0, w: 1, d: 1 }])).toBe(
      false,
    );
  });
});
describe("navigation", () => {
  it("routes around an obstacle and never cuts a corner", () => {
    const obs = [{ x: 0, z: 0, w: 2, d: 2 }];
    const path = pathfind({ x: -3, z: 0 }, { x: 3, z: 0 }, obs);
    expect(path.length).toBeGreaterThan(2);
    for (const p of path) expect(walkable(p, obs)).toBe(true);
    expect(path.some((p) => Math.abs(p.z) > 1.2)).toBe(true);
    expect(path.at(-1)).toEqual({ x: 3, z: 0 });
  });
  it("rejects blocked destinations", () => {
    expect(
      pathfind({ x: 0, z: 2 }, { x: 0, z: 0 }, [{ x: 0, z: 0, w: 1, d: 1 }]),
    ).toEqual([]);
  });
  it("can reach every mandatory interaction from spawn", () => {
    for (const object of interactions) {
      expect(walkable(object.approach, obstacles), object.id).toBe(true);
      expect(
        pathfind({ x: 0, z: 0.3 }, object.approach, obstacles).length,
        object.id,
      ).toBeGreaterThan(0);
    }
  });
});
describe("interaction and avatar states", () => {
  it("chooses only a nearby object", () => {
    const o: Interactive = {
      ...interactions[0],
      approach: { x: 0, z: 0 },
      radius: 1,
    };
    expect(nearest({ x: 0.5, z: 0 }, [o])).toBe(o);
    expect(nearest({ x: 3, z: 0 }, [o])).toBeUndefined();
    expect(distance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
  });
  it("keeps seated avatars seated until stand is requested", () => {
    expect(transition("SITTING", "move")).toBe("SITTING");
    expect(transition("SITTING", "wave")).toBe("SITTING");
    expect(transition("SITTING", "stand")).toBe("STANDING");
    expect(transition("STANDING", "done")).toBe("IDLE");
  });
  it("supports mutually exclusive action states", () => {
    expect(transition("IDLE", "move")).toBe("WALKING");
    expect(transition("IDLE", "wave")).toBe("WAVING");
    expect(transition("IDLE", "interact")).toBe("INTERACTING");
    expect(transition("INTERACTING", "done")).toBe("IDLE");
  });
});
describe("local persistence", () => {
  it("round trips notes and preferences", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
    });
    save("notes", "Una idea");
    expect(readSaved("notes", "")).toBe("Una idea");
    save("preferences", { volume: 0.2 });
    expect(readSaved("preferences", {})).toEqual({ volume: 0.2 });
  });
  it("falls back when data is corrupt or storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{broken",
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readSaved("notes", "fallback")).toBe("fallback");
    expect(() => save("notes", "x")).not.toThrow();
  });
});

describe("kinematic controller", () => {
  it("slides along a wall without entering it", () => {
    const obs = [{ x: 0, z: 0, w: 1, d: 3 }];
    const start = { x: -0.8, z: 0 };
    const next = moveKinematic(start, { x: 0.2, z: 0.2 }, obs);
    expect(next.x).toBe(start.x);
    expect(next.z).toBeCloseTo(0.2);
    expect(walkable(next, obs)).toBe(true);
  });
  it("does not report displacement against a blocked axis", () => {
    const start = { x: 5.5, z: 0 };
    expect(moveKinematic(start, { x: 0.1, z: 0 }, [])).toEqual(start);
  });
  it("all simplified navigation segments stay outside obstacles", () => {
    let start = { x: 0, z: 0.3 };
    for (const object of interactions) {
      const path = pathfind(start, object.approach, obstacles);
      expect(path.length).toBeGreaterThan(0);
      for (const end of path) {
        const steps = Math.ceil(distance(start, end) / 0.025);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          expect(
            walkable(
              {
                x: start.x + (end.x - start.x) * t,
                z: start.z + (end.z - start.z) * t,
              },
              obstacles,
            ),
            object.id,
          ).toBe(true);
        }
        start = end;
      }
    }
  });
});

describe("hallway between rooms", () => {
  it("rejects the void beside the hallway", () => {
    expect(walkable({ x: 7.75, z: -1 }, obstacles)).toBe(true);
    expect(walkable({ x: 7.75, z: 1 }, obstacles)).toBe(false);
    expect(walkable({ x: 7.75, z: -3 }, obstacles)).toBe(false);
  });
  it("crosses into the bedroom only through the doorway", () => {
    const bed = interactions.find((o) => o.id === "bed")!;
    const path = pathfind({ x: 0, z: 3 }, bed.approach, obstacles);
    expect(path.length).toBeGreaterThan(0);
    let start = { x: 0, z: 3 };
    for (const end of path) {
      // Every segment that spans the hallway stays inside its width.
      if ((start.x - 7.75) * (end.x - 7.75) <= 0) {
        const t = (7.75 - start.x) / (end.x - start.x || 1);
        const z = start.z + (end.z - start.z) * t;
        expect(z).toBeGreaterThan(-1.6);
        expect(z).toBeLessThan(-0.4);
      }
      start = end;
    }
  });
});
