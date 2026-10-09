import * as pc from "playcanvas";
import { palette as c, type Builder } from "../world/build";
import { layout } from "../world/layout";
import type { Point } from "./types";
const fur = "#e9a466",
  furDark = "#c98245",
  cream = "#f7e6cc";
type Activity = "eat" | "drink" | "groom" | "sleep" | "greet";
interface Stop {
  activity: Activity;
  at: Point;
  /** Facing once arrived; keeps the travel heading when omitted. */
  angle?: number;
  duration: number;
}
const { petBowls: bowls, catBed: bed } = layout;
// Daily routine. The pet corner is open floor, so Michi walks in straight
// lines between stops instead of using the avatar's NavGrid.
const routine: Stop[] = [
  {
    activity: "eat",
    at: { x: bowls.x - 0.25, z: bowls.z - 0.45 },
    angle: 0,
    duration: 6,
  },
  {
    activity: "drink",
    at: { x: bowls.x + 0.25, z: bowls.z - 0.45 },
    angle: 0,
    duration: 4,
  },
  { activity: "groom", at: { x: -0.3, z: 3.85 }, angle: 35, duration: 5 },
  {
    activity: "sleep",
    at: { x: bed.x + 0.04, z: bed.z + 0.04 },
    angle: 45,
    duration: 16,
  },
  { activity: "groom", at: { x: 1.75, z: 4.15 }, angle: 20, duration: 4 },
];
const WALK_SPEED = 0.6,
  TURN_SPEED = 260;
// Joint angles in degrees, blended towards a per-activity target.
const rest = {
  rootY: 0,
  bodyY: 0.27,
  pitch: 0,
  headPitch: 0,
  headYaw: 0,
  headRoll: 0,
  front: 0,
  hind: 0,
  tailPitch: -35,
  tailBend: -14,
  tailWrap: 0,
  eyes: 1,
};
type Pose = typeof rest;
const poseKeys = Object.keys(rest) as (keyof Pose)[];
/** Michi: a small orange cat with a routine of meals, naps and grooming. */
export class Cat {
  root: pc.Entity;
  position: Point;
  angle = 180;
  private body: pc.Entity;
  private head: pc.Entity;
  private legs: pc.Entity[] = [];
  private tail: pc.Entity[] = [];
  private eyes: pc.Entity[] = [];
  private pose: Pose = { ...rest };
  private target: Pose = { ...rest };
  private index = 0;
  private stop: Stop = routine[0];
  private walking = true;
  private timer = 0;
  private time = 0;
  private gait = 0;
  private phase = 0;
  constructor(b: Builder) {
    const g = b.group.bind(b),
      s = b.shape.bind(b);
    this.position = { x: 0.2, z: 4.1 };
    this.root = b.dynamic(
      g("Cat · Michi", this.position.x, 0, this.position.z),
    );
    this.body = g("Cat body", 0, rest.bodyY, 0, this.root);
    s("Torso", "round", [0, 0, 0], [0.26, 0.22, 0.46], fur, this.body);
    s("Belly", "round", [0, -0.05, 0.03], [0.2, 0.13, 0.36], cream, this.body);
    for (const z of [-0.12, 0, 0.12])
      s("Stripe", "round", [0, 0.1, z], [0.2, 0.03, 0.05], furDark, this.body);
    // Legs hang from pivots inside the torso so bends never open a gap.
    for (const [x, z] of [
      [-0.075, 0.14],
      [0.075, 0.14],
      [-0.075, -0.14],
      [0.075, -0.14],
    ]) {
      const leg = g("Cat leg", x, -0.05, z, this.body);
      s("Leg", "capsule", [0, -0.1, 0], [0.07, 0.22, 0.07], fur, leg);
      s("Paw", "sphere", [0, -0.19, 0.012], [0.075, 0.05, 0.09], cream, leg);
      this.legs.push(leg);
    }
    // Head pivots at the neck; features sit on the head surface.
    this.head = g("Cat neck", 0, 0.08, 0.17, this.body);
    const skull = g("Cat head", 0, 0.06, 0.06, this.head);
    s("Head", "sphere", [0, 0, 0], [0.26, 0.23, 0.23], fur, skull);
    s("Muzzle", "sphere", [0, -0.035, 0.085], [0.13, 0.09, 0.08], cream, skull);
    s(
      "Nose",
      "sphere",
      [0, -0.012, 0.122],
      [0.035, 0.025, 0.02],
      c.pink,
      skull,
    );
    for (const side of [-1, 1]) {
      s(
        "Ear",
        "cone",
        [side * 0.07, 0.11, -0.01],
        [0.085, 0.1, 0.06],
        fur,
        skull,
        [0, 0, -side * 18],
      );
      s(
        "Inner ear",
        "cone",
        [side * 0.068, 0.108, 0.012],
        [0.05, 0.065, 0.02],
        c.pink,
        skull,
        [0, 0, -side * 18],
      );
      this.eyes.push(
        s(
          "Eye",
          "sphere",
          [side * 0.058, 0.025, 0.095],
          [0.045, 0.055, 0.03],
          c.ink,
          skull,
        ),
      );
    }
    // Three-segment tail, each pivot at the tip of the previous segment.
    let parent = g("Cat tail", 0, 0.04, -0.2, this.body);
    for (let i = 0; i < 3; i++) {
      s(
        "Tail",
        "capsule",
        [0, 0.065, 0],
        [0.055, 0.15, 0.055],
        i === 2 ? furDark : fur,
        parent,
      );
      this.tail.push(parent);
      if (i < 2) parent = g("Cat tail", 0, 0.12, 0, parent);
    }
  }
  get sleeping() {
    return !this.walking && this.stop.activity === "sleep";
  }
  /** Michi walks over to sit next to someone. Returns what happens. */
  call(near: Point) {
    const at = { x: near.x - 0.45, z: near.z + 0.35 };
    const wasSleeping = this.sleeping;
    this.stop = {
      activity: "greet",
      at,
      angle: heading(at, near),
      duration: 3.5,
    };
    this.walking = true;
    return wasSleeping
      ? "Michi se despereza y viene a saludarte."
      : "Michi viene a saludarte. Prrr…";
  }
  update(dt: number, reduced: boolean) {
    this.time += dt;
    this.behave(dt);
    this.animate(dt, reduced);
    this.root.setPosition(this.position.x, this.pose.rootY, this.position.z);
    this.root.setEulerAngles(0, this.angle, 0);
  }
  private behave(dt: number) {
    const stop = this.stop;
    if (this.walking) {
      const dx = stop.at.x - this.position.x,
        dz = stop.at.z - this.position.z,
        d = Math.hypot(dx, dz);
      if (d < 0.02) {
        this.walking = false;
        this.timer = stop.duration;
        return;
      }
      // Turn first, then trot: never slide sideways.
      if (this.turn(heading(this.position, stop.at), dt) < 50) {
        const step = Math.min(d, WALK_SPEED * dt);
        this.position.x += (dx / d) * step;
        this.position.z += (dz / d) * step;
      }
      return;
    }
    if (stop.angle !== undefined) this.turn(stop.angle, dt);
    this.timer -= dt;
    if (this.timer <= 0) {
      this.index = (this.index + 1) % routine.length;
      this.stop = routine[this.index];
      this.walking = true;
    }
  }
  /** Rotate towards `angle` along the short arc; returns the remaining gap. */
  private turn(angle: number, dt: number) {
    const diff = ((angle - this.angle + 540) % 360) - 180;
    const step = Math.max(-TURN_SPEED * dt, Math.min(TURN_SPEED * dt, diff));
    this.angle += step;
    return Math.abs(diff - step);
  }
  private animate(dt: number, reduced: boolean) {
    const t = this.time,
      p = this.pose,
      to = this.target,
      calm = reduced ? 0 : 1;
    Object.assign(to, rest);
    const moving = this.walking;
    if (!moving)
      switch (this.stop.activity) {
        case "eat":
        case "drink":
          to.pitch = 8;
          to.headPitch = 48;
          to.front = -6;
          to.tailPitch = -55;
          break;
        case "groom":
        case "greet":
          // Sitting: torso up, hind legs folded, front legs kept vertical.
          to.bodyY = 0.22;
          to.pitch = -28;
          to.headPitch = 20;
          to.front = 28;
          to.hind = -62;
          to.tailPitch = -110;
          to.tailBend = 0;
          to.tailWrap = 30;
          break;
        case "sleep":
          to.rootY = 0.11;
          to.bodyY = 0.13;
          to.headPitch = 22;
          to.headYaw = 40;
          to.front = -82;
          to.hind = -80;
          to.tailPitch = -100;
          to.tailBend = 0;
          to.tailWrap = 42;
          to.eyes = 0.08;
          break;
      }
    const k = 1 - Math.exp(-dt * 7);
    for (const key of poseKeys) p[key] += (to[key] - p[key]) * k;
    this.gait += ((moving ? 1 : 0) - this.gait) * (1 - Math.exp(-dt * 10));
    this.phase += dt * 11 * this.gait;
    // Additive motion on top of the blended pose.
    const activity = moving ? undefined : this.stop.activity;
    const swing = Math.sin(this.phase) * 28 * this.gait;
    let headPitch = p.headPitch,
      headYaw = p.headYaw,
      headRoll = p.headRoll,
      eyes = p.eyes,
      tailSway = Math.sin(t * (moving ? 5 : 1.6)) * (moving ? 8 : 14) * calm,
      breath = 1;
    if (activity === "eat") headPitch += Math.sin(t * 7) * 6 * calm;
    if (activity === "drink") headPitch += Math.sin(t * 11) * 3 * calm;
    if (activity === "groom") {
      // Looks around, then licks a paw now and then.
      const lick = Math.max(0, Math.sin(t * 0.7)) ** 3;
      headYaw += Math.sin(t * 0.45) * 30 * (1 - lick) * calm;
      headPitch += lick * 30 * calm;
      eyes *= 1 - lick * 0.7;
    }
    if (activity === "greet") {
      headRoll += 14;
      eyes = 0.35;
      tailSway *= 1.6;
    }
    if (activity === "sleep") {
      breath += Math.sin(t * 1.8) * 0.035 * calm;
      tailSway *= 0.15;
    } else if (t % 3.7 < 0.12) eyes = Math.min(eyes, 0.1);
    this.body.setLocalPosition(
      0,
      p.bodyY + Math.abs(Math.sin(this.phase)) * 0.015 * this.gait,
      0,
    );
    this.body.setLocalEulerAngles(p.pitch, 0, 0);
    this.body.setLocalScale(1, breath, 1);
    this.head.setLocalEulerAngles(headPitch, headYaw, headRoll);
    this.legs.forEach((leg, i) => {
      // Diagonal pairs move together: front-left with hind-right.
      const front = i < 2,
        sign = i === 0 || i === 3 ? 1 : -1;
      leg.setLocalEulerAngles((front ? p.front : p.hind) + swing * sign, 0, 0);
    });
    this.tail[0].setLocalEulerAngles(p.tailPitch, 0, tailSway);
    for (let i = 1; i < this.tail.length; i++)
      this.tail[i].setLocalEulerAngles(
        p.tailBend,
        0,
        p.tailWrap + tailSway * 0.5,
      );
    for (const eye of this.eyes) eye.setLocalScale(0.045, 0.055 * eyes, 0.03);
  }
}
/** Yaw in degrees that turns +Z (the cat's nose) from `from` towards `to`. */
const heading = (from: Point, to: Point) =>
  (Math.atan2(to.x - from.x, to.z - from.z) * 180) / Math.PI;
