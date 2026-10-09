import { avatarStates, transition, type AvatarEvent } from "./fsm";
import { distance } from "./logic";
import type { NavGrid } from "./navigation";
import type { AvatarState, Interactive, Point } from "./types";
export const WALK_SPEED = 1.85;
export const RUN_SPEED = 2.65;
interface PoseTravel {
  from: Point;
  to: Point;
  elapsed: number;
  duration: number;
}
export type GoResult = "ok" | "blocked" | "unreachable";
export interface StepResult {
  /** Ground speed this frame, for the walk cycle. */
  speed: number;
  /** Object reached at the end of a path, ready to be activated. */
  arrived?: Interactive;
}
/**
 * Avatar intent, navigation and state machine, free of rendering so that it
 * can run unchanged on a server or in tests. The renderer reads `position`,
 * `angle` and `state` after each `update`.
 */
export class AvatarController {
  state: AvatarState = "IDLE";
  position: Point;
  angle = 0;
  path: Point[] = [];
  /** Where the destination marker belongs, while walking a path. */
  destination?: Point;
  pending?: Interactive;
  seated?: Interactive;
  private timer = 0;
  private travel?: PoseTravel;
  private afterStand?: Point;
  constructor(
    private nav: NavGrid,
    spawn: Point,
  ) {
    this.position = { ...spawn };
  }
  get canMove() {
    return avatarStates[this.state].locomotion;
  }
  get busy() {
    return !!this.travel;
  }
  private send(event: AvatarEvent) {
    const next = transition(this.state, event);
    // Re-entering a timed state (e.g. waving again) restarts its clock.
    if (next !== this.state || avatarStates[next].duration)
      this.timer = avatarStates[next].duration ?? 0;
    this.state = next;
  }
  clearPath() {
    this.path = [];
    this.pending = undefined;
    this.destination = undefined;
  }
  go(p: Point): GoResult {
    if (!this.nav.walkable(p)) return "blocked";
    const path = this.nav.pathfind(this.position, p);
    if (!path.length) {
      this.pending = undefined;
      return "unreachable";
    }
    this.path = path;
    this.destination = { ...p };
    return "ok";
  }
  /** Walk to an object, standing up first and queueing the walk if needed. */
  visit(o: Interactive): GoResult {
    if (this.seated) this.stand();
    this.pending = o;
    if (this.travel) {
      this.afterStand = o.approach;
      this.path = [];
      return "ok";
    }
    return this.go(o.approach);
  }
  wave() {
    if (this.seated) return false;
    this.clearPath();
    this.send("wave");
    return true;
  }
  interact() {
    this.send("interact");
  }
  sit(o: Interactive) {
    this.clearPath();
    this.seated = o;
    this.travel = {
      from: { ...this.position },
      to: { ...o.seat! },
      elapsed: 0,
      duration: 0.45,
    };
    this.angle = o.angle ?? 0;
    this.send("sit");
  }
  stand() {
    if (!this.seated) return false;
    this.travel = {
      from: { ...this.position },
      to: { ...this.seated.approach },
      elapsed: 0,
      duration: 0.5,
    };
    this.seated = undefined;
    this.send("stand");
    return true;
  }
  update(dt: number, input: Point | undefined, sprint: boolean): StepResult {
    const result: StepResult = { speed: 0 };
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) this.send("done");
    }
    if (this.canMove) this.locomote(dt, input, sprint, result);
    this.updateTravel(dt);
    return result;
  }
  private locomote(
    dt: number,
    input: Point | undefined,
    sprint: boolean,
    result: StepResult,
  ) {
    let dir = input;
    if (dir) this.clearPath();
    else if (this.path.length) {
      const next = this.path[0];
      const dist = distance(this.position, next);
      if (dist < 0.09) {
        this.path.shift();
        if (!this.path.length) {
          result.arrived = this.pending;
          this.clearPath();
        }
      } else
        dir = {
          x: (next.x - this.position.x) / dist,
          z: (next.z - this.position.z) / dist,
        };
    }
    if (!dir) {
      if (this.state === "WALKING" || this.state === "TURNING")
        this.send("stop");
      return;
    }
    const speed = sprint ? RUN_SPEED : WALK_SPEED;
    const desired = (Math.atan2(dir.x, dir.z) * 180) / Math.PI;
    const diff = ((desired - this.angle + 540) % 360) - 180;
    this.angle += diff * (1 - Math.exp(-dt * 9));
    // Large turns happen in place before walking.
    if (Math.abs(diff) > 75) {
      this.send("turn");
      return;
    }
    const increment = Math.min(
      speed * dt,
      this.path.length ? distance(this.position, this.path[0]) : Infinity,
    );
    const next = this.nav.move(this.position, {
      x: dir.x * increment,
      z: dir.z * increment,
    });
    if (distance(this.position, next) > 0.00001) {
      this.position = next;
      result.speed = speed;
      this.send("move");
    } else {
      this.clearPath();
      this.send("stop");
    }
  }
  private updateTravel(dt: number) {
    const travel = this.travel;
    if (!travel) return;
    travel.elapsed += dt;
    const t = Math.min(1, travel.elapsed / travel.duration),
      u = t * t * (3 - 2 * t);
    this.position.x = travel.from.x + (travel.to.x - travel.from.x) * u;
    this.position.z = travel.from.z + (travel.to.z - travel.from.z) * u;
    if (t < 1) return;
    this.travel = undefined;
    if (this.afterStand) {
      const destination = this.afterStand;
      this.afterStand = undefined;
      this.go(destination);
    }
  }
}
