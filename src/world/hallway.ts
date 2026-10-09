import { palette as c, type Builder } from "./builder";
import type { Props } from "./props";
export function buildHallway(b: Builder, props: Props) {
  const shape = b.shape.bind(b);
  const { plant, art } = props;
  // Hallway towards the bedroom: full-height back wall, low cutaway front.
  shape("Hallway base", "round", [7.75, -0.33, -1], [3.9, 0.52, 1.9], c.cream);
  shape(
    "Hallway floor",
    "box",
    [7.75, -0.055, -1],
    [3.8, 0.12, 1.6],
    "#d6b38a",
  );
  b.boxes(
    "Hallway floorboards",
    ["#dfbf99", "#e5c7a4", "#d7b58e", "#dfbd93"].map((color, k) => ({
      pos: [7.75, 0.014, -1.6 + k * 0.4],
      scale: [3.76, 0.028, 0.38],
      color,
    })),
  );
  shape(
    "Hallway runner",
    "round",
    [7.75, 0.04, -1],
    [3.2, 0.03, 0.9],
    "#d39a83",
  );
  for (const z of [-1.33, -0.67])
    shape("Runner stripe", "box", [7.75, 0.058, z], [3, 0.006, 0.05], c.cream);
  for (let i = 0; i < 7; i++)
    shape(
      "Runner diamond",
      "box",
      [6.55 + i * 0.4, 0.058, -1],
      [0.16, 0.006, 0.16],
      c.gold,
      b.root,
      [0, 45, 0],
    );
  shape(
    "Hallway wall",
    "box",
    [7.75, 1.55, -1.91],
    [3.7, 3.4, 0.22],
    "#eee2cb",
  );
  shape("Hallway trim", "box", [7.75, 0.17, -1.76], [3.7, 0.22, 0.08], c.white);
  shape("Hallway cap", "box", [7.75, 3.27, -1.91], [3.7, 0.1, 0.32], c.white);
  shape(
    "Hallway low wall",
    "box",
    [7.75, 0.3, -0.09],
    [3.7, 0.6, 0.2],
    "#e5dbc6",
  );
  shape(
    "Low wall cap",
    "round",
    [7.75, 0.63, -0.09],
    [3.8, 0.07, 0.3],
    c.white,
  );
  plant({ x: 6.6, z: -0.09 }, 0.32, 0.665);
  plant({ x: 8.9, z: -0.09 }, 0.32, 0.665);
  art(
    "Artwork · Little house",
    7.15,
    1.95,
    0.5,
    0.42,
    (p) => {
      p("Sky", "box", 0, 0, 0, 1.3, 1.3, "#dfe9e6");
      p("Hill", "sphere", 0, -0.5, 1, 1.4, 0.7, c.sage);
      p("House", "box", 0, -0.08, 2, 0.34, 0.3, c.cream);
      p("Roof", "cone", 0, 0.14, 3, 0.44, 0.22, c.terra);
      p("Door", "box", 0.06, -0.15, 4, 0.08, 0.16, c.darkWood);
      p("Window", "box", -0.08, -0.06, 4, 0.08, 0.08, c.gold, 0, 0.2);
    },
    -1.795,
  );
  art(
    "Artwork · Crescent",
    8.35,
    2.1,
    0.38,
    0.5,
    (p) => {
      p("Night", "box", 0, 0, 0, 1.3, 1.3, "#5d6f86");
      p("Moon", "sphere", 0, 0.08, 1, 0.5, 0.4, c.gold, 0, 0.25);
      p("Moon bite", "sphere", 0.12, 0.13, 2, 0.45, 0.36, "#5d6f86");
      for (const [sx, sy] of [
        [-0.3, 0.35],
        [0.3, -0.2],
        [-0.2, -0.3],
      ])
        p("Star", "sphere", sx, sy, 2, 0.05, 0.04, c.white, 0, 0.3);
    },
    -1.795,
  );
  for (const x of [6.4, 9.1]) {
    shape(
      "Sconce plate",
      "round",
      [x, 2.25, -1.78],
      [0.16, 0.26, 0.04],
      c.gold,
    );
    shape(
      "Sconce glow",
      "sphere",
      [x, 2.28, -1.7],
      [0.2, 0.2, 0.14],
      c.gold,
      b.root,
      [],
      0.8,
    );
  }
  for (let i = 0; i < 3; i++) {
    shape(
      "Coat hook",
      "capsule",
      [6.95 + i * 0.4, 1.55, -1.75],
      [0.035, 0.12, 0.035],
      c.darkWood,
      b.root,
      [70, 0, 0],
    );
  }
  shape(
    "Hanging scarf",
    "round",
    [7.35, 1.2, -1.74],
    [0.16, 0.65, 0.05],
    c.pink,
  );
  shape(
    "Hanging tote",
    "round",
    [7.75, 1.25, -1.72],
    [0.32, 0.4, 0.08],
    c.cream,
  );
}
