import { describe, expect, it } from "vitest";
import {
  AvatarController,
  WALK_SPEED,
  RUN_SPEED,
} from "../src/game/avatarController";
import { NavGrid } from "../src/game/navigation";
import type { Interactive } from "../src/game/types";
const areas = [{ minX: -5, maxX: 5, minZ: -5, maxZ: 5 }];
const seat: Interactive = {
  id: "seat",
  name: "Seat",
  type: "seat",
  position: { x: 0, z: 1 },
  approach: { x: 0, z: 0 },
  seat: { x: 0, z: 1 },
  radius: 1,
  state: false,
};
const make = () => new AvatarController(new NavGrid(areas, []), { x: 0, z: 0 });
describe("AvatarController", () => {
  it("moves at walk and sprint speeds and turns before reversing", () => {
    const c = make();
    c.update(0.1, { x: 0, z: 1 }, false);
    expect(c.position.z).toBeCloseTo(WALK_SPEED * 0.1);
    c.update(0.1, { x: 0, z: 1 }, true);
    expect(c.position.z).toBeCloseTo((WALK_SPEED + RUN_SPEED) * 0.1);
    const before = { ...c.position };
    c.update(0.1, { x: 0, z: -1 }, false);
    expect(c.state).toBe("TURNING");
    expect(c.position).toEqual(before);
  });
  it("blocks movement during actions and restarts repeated waves", () => {
    const c = make();
    c.wave();
    c.update(1, { x: 0, z: 1 }, false);
    expect(c.position).toEqual({ x: 0, z: 0 });
    c.wave();
    c.update(1, undefined, false);
    expect(c.state).toBe("WAVING");
    c.update(0.81, undefined, false);
    expect(c.state).toBe("IDLE");
    c.interact();
    c.update(0.86, undefined, false);
    expect(c.state).toBe("IDLE");
  });
  it("keeps a seat occupied until standing and queues a visit after standing", () => {
    const c = make();
    c.sit(seat);
    c.update(0.45, { x: 1, z: 0 }, false);
    expect(c.position).toEqual(seat.seat);
    expect(c.wave()).toBe(false);
    const target = { ...seat, id: "next", approach: { x: 2, z: 0 } };
    expect(c.visit(target)).toBe("ok");
    expect(c.state).toBe("STANDING");
    c.update(0.5, undefined, false);
    expect(c.position).toEqual(seat.approach);
    let arrived;
    for (let i = 0; i < 100 && !arrived; i++)
      arrived = c.update(0.05, undefined, false).arrived;
    expect(arrived).toBe(target);
    expect(c.destination).toBeUndefined();
  });
  it("cancels automatic navigation on keyboard input and rejects blocked targets", () => {
    const c = make();
    expect(c.go({ x: 0, z: 3 })).toBe("ok");
    c.update(0.1, { x: 0, z: 1 }, false);
    expect(c.path).toEqual([]);
    expect(c.destination).toBeUndefined();
    expect(c.go({ x: 6, z: 0 })).toBe("blocked");
  });
});
