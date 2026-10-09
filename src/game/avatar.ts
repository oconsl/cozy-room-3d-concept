import * as pc from "playcanvas";
import { Builder, palette as c } from "../world/build";
import type { AvatarState } from "./logic";
const skin = "#efc6a4",
  skinShade = "#e9bb98",
  hair = "#72533f";
interface Limb {
  root: pc.Entity;
  mid: pc.Entity;
  end: pc.Entity;
}
// Joint angles in degrees, tracked here (not read back from the entities) so
// blending never fights Euler decomposition.
const rest = {
  hipY: 0.62,
  hipYaw: 0,
  spinePitch: 0,
  spineYaw: 0,
  spineRoll: 0,
  headPitch: 0,
  headRoll: 0,
  thigh: [0, 0],
  knee: [0, 0],
  ankle: [0, 0],
  shoulder: [0, 0],
  shoulderOut: [0, 0],
  elbow: [0, 0],
  elbowRoll: [0, 0],
  wrist: [0, 0],
};
type Pose = typeof rest;
export class Avatar {
  root: pc.Entity;
  hips: pc.Entity;
  body: pc.Entity;
  neck: pc.Entity;
  head: pc.Entity;
  arms: Limb[] = [];
  legs: Limb[] = [];
  eyes: pc.Entity[] = [];
  pose: Pose = structuredClone(rest);
  constructor(b: Builder) {
    const g = b.group.bind(b),
      s = b.shape.bind(b);
    this.root = g("Avatar · Nilo", 0, 0, 0.3);
    this.hips = g("Hips", 0, rest.hipY, 0, this.root);
    s(
      "Trouser seat",
      "round",
      [0, 0.02, 0],
      [0.46, 0.2, 0.3],
      c.cream,
      this.hips,
    );
    // Legs: hip → knee → ankle, each a pivot so the knee can bend.
    for (const side of [-1, 1]) {
      const hip = g("Hip joint", side * 0.12, 0, 0, this.hips);
      s("Thigh", "capsule", [0, -0.13, 0], [0.2, 0.33, 0.21], c.cream, hip);
      const knee = g("Knee", 0, -0.27, 0, hip);
      s("Knee pad", "sphere", [0, 0, 0.005], [0.19, 0.17, 0.2], c.cream, knee);
      s("Shin", "capsule", [0, -0.12, 0], [0.18, 0.3, 0.19], c.cream, knee);
      s("Turn-up", "round", [0, -0.215, 0], [0.2, 0.06, 0.21], "#e6dcc6", knee);
      const ankle = g("Ankle", 0, -0.26, 0, knee);
      s("Sock", "cylinder", [0, 0.0, 0], [0.13, 0.05, 0.13], c.pink, ankle);
      s(
        "Sneaker",
        "round",
        [0, -0.035, 0.06],
        [0.2, 0.12, 0.33],
        c.white,
        ankle,
      );
      s(
        "Toe cap",
        "sphere",
        [0, -0.045, 0.19],
        [0.18, 0.1, 0.12],
        "#f1e6d2",
        ankle,
      );
      s(
        "Sole",
        "round",
        [0, -0.085, 0.06],
        [0.21, 0.04, 0.34],
        "#cabca6",
        ankle,
      );
      s(
        "Laces",
        "box",
        [0, 0.02, 0.1],
        [0.11, 0.012, 0.09],
        c.wood,
        ankle,
        [25, 0, 0],
      );
      this.legs.push({ root: hip, mid: knee, end: ankle });
    }
    // Torso pivots at the waist so it can lean and counter-twist.
    this.body = g("Body", 0, 0.05, 0, this.hips);
    s(
      "Sweater waist",
      "round",
      [0, 0.16, 0],
      [0.5, 0.3, 0.33],
      c.sage,
      this.body,
    );
    s(
      "Sweater chest",
      "round",
      [0, 0.37, 0],
      [0.58, 0.32, 0.37],
      c.sage,
      this.body,
    );
    s(
      "Ribbed hem",
      "round",
      [0, 0.02, 0],
      [0.53, 0.09, 0.35],
      c.sageDark,
      this.body,
    );
    for (let i = -2; i <= 2; i++)
      s(
        "Rib",
        "box",
        [i * 0.1, 0.02, 0.177],
        [0.012, 0.07, 0.01],
        "#5f8164",
        this.body,
      );
    s(
      "Pocket",
      "round",
      [0, 0.17, 0.165],
      [0.27, 0.15, 0.035],
      "#a1b594",
      this.body,
    );
    s(
      "Pocket seam",
      "box",
      [0, 0.235, 0.184],
      [0.22, 0.012, 0.008],
      c.sageDark,
      this.body,
    );
    s(
      "Sweater collar",
      "cylinder",
      [0, 0.53, 0],
      [0.27, 0.06, 0.24],
      c.cream,
      this.body,
    );
    // Arms: shoulder → elbow → wrist.
    for (const side of [-1, 1]) {
      const shoulder = g("Shoulder", side * 0.33, 0.45, 0, this.body);
      s(
        "Shoulder cap",
        "sphere",
        [0, 0, 0],
        [0.21, 0.21, 0.22],
        c.sage,
        shoulder,
      );
      s(
        "Upper sleeve",
        "capsule",
        [0, -0.12, 0],
        [0.17, 0.3, 0.18],
        c.sage,
        shoulder,
      );
      const elbow = g("Elbow", 0, -0.24, 0, shoulder);
      s("Elbow", "sphere", [0, 0, 0], [0.16, 0.16, 0.17], c.sage, elbow);
      s(
        "Forearm sleeve",
        "capsule",
        [0, -0.1, 0],
        [0.155, 0.26, 0.165],
        c.sage,
        elbow,
      );
      s(
        "Sleeve cuff",
        "round",
        [0, -0.2, 0],
        [0.17, 0.07, 0.18],
        c.sageDark,
        elbow,
      );
      const wrist = g("Wrist", 0, -0.23, 0, elbow);
      s("Palm", "sphere", [0, -0.05, 0], [0.13, 0.15, 0.1], skinShade, wrist);
      s(
        "Thumb",
        "capsule",
        [-side * 0.055, -0.035, 0.035],
        [0.05, 0.09, 0.05],
        skinShade,
        wrist,
        [25, 0, side * 30],
      );
      this.arms.push({ root: shoulder, mid: elbow, end: wrist });
    }
    this.neck = g("Neck", 0, 0.56, 0, this.body);
    s(
      "Neck",
      "capsule",
      [0, 0.03, 0],
      [0.13, 0.14, 0.13],
      skinShade,
      this.neck,
    );
    this.head = g("Head", 0, 0.24, 0, this.neck);
    s("Face", "sphere", [0, 0, 0], [0.7, 0.7, 0.62], skin, this.head);
    s(
      "Hair cap",
      "sphere",
      [0, 0.14, -0.055],
      [0.73, 0.55, 0.64],
      hair,
      this.head,
    );
    s(
      "Hair back",
      "sphere",
      [0, 0.015, -0.22],
      [0.68, 0.54, 0.28],
      hair,
      this.head,
    );
    for (let i = 0; i < 5; i++)
      s(
        "Soft fringe",
        "sphere",
        [-0.25 + i * 0.12, 0.21 - (i % 2) * 0.04, 0.22],
        [0.22, 0.26, 0.22],
        hair,
        this.head,
        [0, 0, -20 + i * 7],
      );
    for (const side of [-1, 1]) {
      s(
        "Ear",
        "sphere",
        [side * 0.345, -0.025, 0],
        [0.14, 0.2, 0.16],
        skin,
        this.head,
      );
      const eye = s(
        "Eye",
        "sphere",
        [side * 0.135, -0.015, 0.293],
        [0.068, 0.105, 0.034],
        c.ink,
        this.head,
      );
      this.eyes.push(eye);
      s(
        "Eye sparkle",
        "sphere",
        [side * 0.135 - 0.01, 0.006, 0.313],
        [0.018, 0.025, 0.009],
        c.white,
        this.head,
      );
      s(
        "Brow",
        "capsule",
        [side * 0.14, 0.085, 0.29],
        [0.022, 0.08, 0.02],
        "#5e4433",
        this.head,
        [0, 0, 90 + side * 10],
      );
      s(
        "Cheek",
        "sphere",
        [side * 0.225, -0.09, 0.258],
        [0.095, 0.048, 0.021],
        c.pink,
        this.head,
      );
    }
    s(
      "Button nose",
      "sphere",
      [0, -0.07, 0.314],
      [0.065, 0.056, 0.056],
      "#dda987",
      this.head,
    );
    s(
      "Smile",
      "sphere",
      [0, -0.155, 0.287],
      [0.085, 0.03, 0.018],
      "#966552",
      this.head,
    );
  }
  animate(
    state: AvatarState,
    time: number,
    speed: number,
    reduced: boolean,
    dt: number,
    seatHeight = 0.84,
  ) {
    const walk = state === "WALKING";
    const sit = state === "SITTING";
    const breathe = reduced ? 0 : Math.sin(time * 2);
    const sway = reduced ? 0 : Math.sin(time * 0.8);
    const phase = time * speed * 5;
    const target: Pose = structuredClone(rest);
    // Idle: soft breathing, relaxed elbows, a slow weight shift.
    target.hipY = rest.hipY + breathe * 0.004;
    target.spinePitch = breathe * 1.2;
    target.spineRoll = sway * 1.5;
    target.headRoll = -sway * 2;
    target.headPitch = -breathe * 1.5;
    target.elbow = [-10, -10];
    target.shoulderOut = [-6, 6];
    target.knee = [3, 3];
    if (walk) {
      const step = Math.sin(phase),
        lift = Math.abs(Math.cos(phase));
      target.hipY = rest.hipY - 0.025 + lift * 0.035;
      target.hipYaw = -step * 6;
      target.spineYaw = step * 9;
      target.spinePitch = 5;
      target.spineRoll = 0;
      target.headPitch = -3;
      target.headRoll = 0;
      for (let i = 0; i < 2; i++) {
        const s = Math.sin(phase + i * Math.PI),
          c = Math.cos(phase + i * Math.PI);
        // Positive thigh angle = leg behind; the knee folds while the leg
        // swings forward (c < 0) and stays nearly straight while planted.
        target.thigh[i] = s * 28;
        target.knee[i] = 6 + Math.max(0, -c) * 52;
        target.ankle[i] = -(target.thigh[i] + target.knee[i]) * 0.55;
        target.shoulder[i] = -s * 24;
        target.elbow[i] = -22 - Math.max(0, s) * 26;
      }
    }
    if (sit) {
      target.hipY = seatHeight + 0.03;
      target.spinePitch = -6;
      target.headPitch = 4;
      for (let i = 0; i < 2; i++) {
        target.thigh[i] = -84;
        target.knee[i] = 52;
        target.ankle[i] = -18;
        target.shoulder[i] = -22;
        target.elbow[i] = -58;
        target.shoulderOut[i] = (i ? 1 : -1) * 6;
        target.wrist[i] = 10;
      }
    }
    if (state === "INTERACTING") {
      target.headPitch = 8;
      target.headRoll = -8;
      target.spinePitch = 6;
      target.shoulder[1] = -62;
      target.elbow[1] = -38;
      target.wrist[1] = -15;
    }
    if (state === "WAVING") {
      const wave = reduced ? 0 : Math.sin(time * 12);
      target.shoulderOut[1] = 140;
      target.elbow[1] = 0;
      target.elbowRoll[1] = 20 + wave * 25;
      target.wrist[1] = wave * 12;
      target.headRoll = 7;
      target.spineRoll = -3;
    }
    const k = 1 - Math.exp(-dt * 12);
    const p = this.pose;
    for (const key of Object.keys(p) as (keyof Pose)[]) {
      const cur = p[key],
        to = target[key];
      if (Array.isArray(cur) && Array.isArray(to)) {
        for (let i = 0; i < cur.length; i++)
          cur[i] = pc.math.lerp(cur[i], to[i], k);
      } else (p[key] as number) = pc.math.lerp(cur as number, to as number, k);
    }
    this.hips.setLocalPosition(0, p.hipY, 0);
    this.hips.setLocalEulerAngles(0, p.hipYaw, 0);
    this.body.setLocalEulerAngles(p.spinePitch, p.spineYaw, p.spineRoll);
    this.neck.setLocalEulerAngles(p.headPitch * 0.4, -p.spineYaw * 0.6, 0);
    this.head.setLocalEulerAngles(
      p.headPitch * 0.6,
      -p.spineYaw * 0.4 + sway * (reduced ? 0 : 3),
      p.headRoll,
    );
    for (let i = 0; i < 2; i++) {
      const leg = this.legs[i],
        arm = this.arms[i];
      leg.root.setLocalEulerAngles(p.thigh[i], 0, 0);
      leg.mid.setLocalEulerAngles(p.knee[i], 0, 0);
      leg.end.setLocalEulerAngles(p.ankle[i], 0, 0);
      arm.root.setLocalEulerAngles(p.shoulder[i], 0, p.shoulderOut[i]);
      arm.mid.setLocalEulerAngles(p.elbow[i], 0, p.elbowRoll[i]);
      arm.end.setLocalEulerAngles(p.wrist[i], 0, 0);
    }
    const blink = !reduced && time % 5.3 > 5.12;
    this.eyes.forEach((e) =>
      e.setLocalScale(0.068, blink ? 0.016 : 0.105, 0.034),
    );
  }
}
