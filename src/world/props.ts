import * as pc from "playcanvas";
import { palette as c, type Builder } from "./builder";
import type { Point } from "../game/types";
/** Reusable furniture pieces shared by every room. */
export function createProps(b: Builder) {
  const shape = b.shape.bind(b);
  const g = b.group.bind(b);
  const legs = (parent: pc.Entity, w: number, d: number, h: number) => {
    for (const x of [-w / 2, w / 2])
      for (const z of [-d / 2, d / 2])
        shape(
          "Wood leg",
          "cylinder",
          [x, h / 2, z],
          [0.09, h, 0.09],
          c.darkWood,
          parent,
        );
  };
  const mug = (
    x: number,
    y: number,
    z: number,
    parent: pc.Entity,
    color = c.white,
  ) => {
    shape(
      "Ceramic cup",
      "cylinder",
      [x, y, z],
      [0.2, 0.22, 0.2],
      color,
      parent,
    );
    shape(
      "Coffee",
      "cylinder",
      [x, y + 0.116, z],
      [0.145, 0.008, 0.145],
      c.darkWood,
      parent,
    );
    shape(
      "Cup handle",
      "round",
      [x + 0.13, y, z],
      [0.1, 0.13, 0.08],
      color,
      parent,
    );
  };
  const plants: pc.Entity[] = [];
  const plant = (at: Point, size = 1, y = 0) => {
    const p = g("Plant", at.x, y, at.z);
    b.frustum(
      "Terracotta pot",
      [0, 0.23, 0],
      [0.38, 0.46, 0.38],
      1.3,
      c.terra,
      p,
    );
    shape("Pot lip", "cylinder", [0, 0.46, 0], [0.54, 0.08, 0.54], c.terra, p);
    shape(
      "Earth",
      "cylinder",
      [0, 0.505, 0],
      [0.44, 0.015, 0.44],
      c.darkWood,
      p,
    );
    const leaves = b.dynamic(g("Foliage", 0, 0.45, 0, p));
    const up = new pc.Vec3(0, 1, 0);
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.4;
      const x = Math.cos(angle) * 0.24,
        z = Math.sin(angle) * 0.24,
        y = 0.22 + i * 0.035;
      // Stem runs from the soil to the base of its leaf.
      const tip = new pc.Vec3(x * 0.55, y - 0.02, z * 0.55);
      const foot = new pc.Vec3(x * 0.1, 0.05, z * 0.1);
      const dir = tip.clone().sub(foot);
      const length = dir.length();
      const stem = shape(
        "Stem",
        "capsule",
        [(tip.x + foot.x) / 2, (tip.y + foot.y) / 2, (tip.z + foot.z) / 2],
        [0.03, length, 0.03],
        c.sageDark,
        leaves,
      );
      const axis = new pc.Vec3().cross(up, dir.normalize());
      stem.setLocalRotation(
        new pc.Quat().setFromAxisAngle(
          axis.normalize(),
          Math.acos(dir.dot(up)) * pc.math.RAD_TO_DEG,
        ),
      );
      shape(
        "Leaf",
        "sphere",
        [x, y, z],
        [0.32, 0.09, 0.6],
        i % 2 ? c.sage : c.sageDark,
        leaves,
        [20, i * 137, 25],
      );
    }
    p.setLocalScale(size, size, size);
    plants.push(leaves);
    return p;
  };
  const shelf = (at: Point, angle = 0, height = 2.1, width = 1.7) => {
    const p = g("Bookshelf", at.x, 0, at.z);
    p.setLocalEulerAngles(0, angle, 0);
    shape(
      "Shelf back",
      "round",
      [0, height / 2, -0.18],
      [width, height, 0.13],
      c.wood,
      p,
    );
    for (const side of [-1, 1])
      shape(
        "Shelf side",
        "round",
        [(side * width) / 2, height / 2, 0],
        [0.13, height, 0.45],
        c.wood,
        p,
      );
    for (let j = 0; j < 4; j++) {
      const y = 0.12 + (j * height) / 3;
      shape("Shelf plank", "round", [0, y, 0], [width, 0.1, 0.5], c.wood, p);
      if (j < 3)
        for (let i = 0; i < 7; i++)
          shape(
            "Book spine",
            "round",
            [-width / 2 + 0.2 + i * 0.19, y + 0.24, 0.04],
            [0.12, 0.3 + (i % 3) * 0.08, 0.27],
            [c.sage, c.pink, c.blue, c.gold, c.cream, c.terra][(i + j) % 6],
            p,
            [0, 0, i === 5 ? -12 : 0],
          );
    }
    return p;
  };
  const chair = (at: Point, color: string, angle = 0) => {
    const p = g("Chair", at.x, 0, at.z);
    legs(p, 0.57, 0.54, 0.62);
    shape("Chair seat", "round", [0, 0.64, 0], [0.88, 0.17, 0.85], color, p);
    shape(
      "Chair back",
      "round",
      [0, 1.06, -0.35],
      [0.87, 0.85, 0.15],
      color,
      p,
      [-8, 0, 0],
    );
    shape(
      "Back support",
      "box",
      [0, 0.75, -0.35],
      [0.65, 0.52, 0.1],
      c.wood,
      p,
    );
    p.setLocalEulerAngles(0, angle, 0);
    return p;
  };
  // Framed artwork: oak frame, gilded lip and a cream mat in front of the
  // painted layers, so the soft shapes can overflow and get cropped by the mat.
  type Paint = (
    name: string,
    kind: "box" | "sphere" | "cylinder" | "cone" | "capsule" | "round",
    x: number,
    y: number,
    layer: number,
    w: number,
    h: number,
    color: string,
    roll?: number,
    emission?: number,
  ) => void;
  const art = (
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    paint: (p: Paint) => void,
    z = -5.785,
  ) => {
    const frame = g(name, x, y, z);
    const mat = 0.085,
      lip = 0.022,
      rail = 0.075;
    const ow = w + 2 * (mat + lip),
      oh = h + 2 * (mat + lip);
    // Ring of four bars around an opening `inner` wider than the painting.
    const bar = (
      label: string,
      width: number,
      depth: number,
      z: number,
      color: string,
      inner: number,
    ) => {
      const fw = w + 2 * inner,
        fh = h + 2 * inner;
      for (const s of [-1, 1]) {
        shape(
          label,
          "round",
          [0, (s * (fh + width)) / 2, z],
          [fw + 2 * width, width, depth],
          color,
          frame,
        );
        shape(
          label,
          "round",
          [(s * (fw + width)) / 2, 0, z],
          [width, fh, depth],
          color,
          frame,
        );
      }
    };
    shape("Art backing", "box", [0, 0, 0.02], [ow, oh, 0.02], c.white, frame);
    const p: Paint = (
      label,
      kind,
      px,
      py,
      layer,
      pw,
      ph,
      color,
      roll = 0,
      emission = 0,
    ) => {
      shape(
        label,
        kind,
        [px * w, py * h, 0.034 + layer * 0.004],
        [pw * w, ph * h, 0.006],
        color,
        frame,
        roll ? [0, 0, roll] : [],
        emission,
      );
    };
    paint(p);
    bar("Art mat", mat, 0.02, 0.07, "#fbf4e6", 0);
    bar("Gilded lip", lip, 0.03, 0.08, c.gold, mat);
    bar("Oak frame", rail, 0.12, 0.065, c.wood, mat + lip);
    // Brass nail and hanging cord peeking above the frame.
    const top = oh / 2 + rail;
    shape(
      "Brass nail",
      "sphere",
      [0, top + 0.17, 0.02],
      [0.05, 0.05, 0.05],
      c.gold,
      frame,
    );
    for (const s of [-1, 1])
      shape(
        "Hanging cord",
        "box",
        [s * 0.13, top + 0.085, 0.015],
        [0.012, 0.3, 0.008],
        c.darkWood,
        frame,
        [0, 0, s * 58],
      );
  };
  return { legs, mug, plant, shelf, chair, art, plants };
}
export type Props = ReturnType<typeof createProps>;
