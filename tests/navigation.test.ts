import { describe, expect, it } from "vitest";
import { lineClear, NavGrid, walkable } from "../src/game/navigation";
import { floorAreas, interactions, obstacles } from "../src/world/config";
describe("NavGrid", () => {
  it("reuses occupancy across searches without retaining search state", () => {
    const nav = new NavGrid(floorAreas, obstacles);
    const spawn = { x: 0, z: 0.3 };
    for (const object of interactions) {
      for (const [start, end] of [
        [spawn, object.approach],
        [object.approach, spawn],
      ]) {
        const path = nav.pathfind(start, end);
        expect(path.length, object.id).toBeGreaterThan(0);
        expect(path.at(-1)).toEqual(end);
        let previous = start;
        for (const point of path) {
          expect(nav.walkable(point)).toBe(
            walkable(point, obstacles, floorAreas),
          );
          expect(nav.lineClear(previous, point)).toBe(true);
          previous = point;
        }
      }
    }
  });
  it("rejects routes between disconnected floors", () => {
    const nav = new NavGrid(
      [
        { minX: -3, maxX: -1, minZ: -1, maxZ: 1 },
        { minX: 1, maxX: 3, minZ: -1, maxZ: 1 },
      ],
      [],
    );
    expect(nav.pathfind({ x: -2, z: 0 }, { x: 2, z: 0 })).toEqual([]);
    expect(nav.lineClear({ x: -2, z: 0 }, { x: 2, z: 0 })).toBe(false);
  });
  it("does not bridge floor gaps smaller than a cell", () => {
    const nav = new NavGrid(
      [
        { minX: -2, maxX: 0.1, minZ: -1, maxZ: 1 },
        { minX: 0.2, maxX: 2, minZ: -1, maxZ: 1 },
      ],
      [],
    );
    expect(nav.pathfind({ x: -1, z: 0 }, { x: 1, z: 0 })).toEqual([]);
  });
  it("detects thin obstacles between otherwise free grid cells", () => {
    const areas = [{ minX: -2, maxX: 2, minZ: -2, maxZ: 2 }];
    const obs = [{ x: 0.2, z: 0, w: 0.01, d: 1 }];
    const nav = new NavGrid(areas, obs);
    const start = { x: -1, z: 0 },
      end = { x: 1, z: 0 };
    expect(lineClear(start, end, obs, areas)).toBe(false);
    const path = nav.pathfind(start, end);
    expect(path.length).toBeGreaterThan(1);
    let previous = start;
    for (const point of path) {
      expect(nav.lineClear(previous, point)).toBe(true);
      previous = point;
    }
  });
});
