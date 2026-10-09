import { palette as c, type Builder } from "./builder";
import { layout } from "./layout";
import type { Props } from "./props";
export function buildBedroom(b: Builder, props: Props) {
  const shape = b.shape.bind(b);
  const g = b.group.bind(b);
  const { plant, art } = props;
  // Bedroom: twilight blues and blush walls, bed, wardrobe and a quiet corner.
  const bx = 13.6,
    bz = -1.9;
  shape("Bedroom base", "round", [bx, -0.37, bz], [8.2, 0.62, 8.2], c.cream);
  shape("Bedroom floor", "box", [bx, -0.055, bz], [8, 0.12, 8], "#d6b38a");
  const boards = [];
  const tones = ["#e3c6a0", "#dcbb93", "#e7cdaa", "#d9b88f"];
  for (let j = 0; j < 16; j++) {
    const z = -5.65 + j * 0.5,
      seam = bx + ((j % 3) - 1) * 1.6;
    boards.push(
      {
        pos: [(9.62 + seam) / 2, 0.014, z],
        scale: [seam - 9.63, 0.028, 0.477],
        color: tones[j % 4],
      },
      {
        pos: [(seam + 17.58) / 2, 0.014, z],
        scale: [17.57 - seam, 0.028, 0.477],
        color: tones[(j + 2) % 4],
      },
    );
  }
  b.boxes("Bedroom boards", boards);
  const blush = "#ecdcd0";
  shape("Bedroom back wall", "box", [bx, 1.55, -5.9], [8.2, 3.4, 0.22], blush);
  shape("Wainscot", "box", [bx, 0.6, -5.775], [7.95, 1.1, 0.03], "#f6ece2");
  shape("Chair rail", "round", [bx, 1.16, -5.76], [7.95, 0.06, 0.06], c.white);
  shape(
    "Bedroom back trim",
    "box",
    [bx, 0.17, -5.75],
    [7.95, 0.22, 0.08],
    c.white,
  );
  shape("Bedroom back cap", "box", [bx, 3.27, -5.9], [8.2, 0.1, 0.32], c.white);
  shape(
    "Bedroom left wall",
    "box",
    [9.6, 1.55, -3.9],
    [0.22, 3.4, 4.2],
    "#e5d2c6",
  );
  shape(
    "Bedroom left cap",
    "box",
    [9.6, 3.27, -3.9],
    [0.32, 0.1, 4.2],
    c.white,
  );
  shape(
    "Bedroom left trim",
    "box",
    [9.75, 0.17, -3.85],
    [0.08, 0.22, 4.1],
    c.white,
  );
  shape("Door casing", "round", [9.6, 1.65, -1.8], [0.34, 3.3, 0.1], c.wood);
  shape(
    "Bedroom low wall",
    "box",
    [9.6, 0.3, 0.95],
    [0.22, 0.6, 2.3],
    "#e5d2c6",
  );
  shape(
    "Bedroom low cap",
    "round",
    [9.6, 0.63, 0.95],
    [0.3, 0.07, 2.4],
    c.white,
  );
  shape("Low wall post", "round", [9.6, 0.36, -0.2], [0.3, 0.72, 0.12], c.wood);

  // Bed with upholstered headboard, quilt and plenty of pillows.
  const bed = g("Bed", layout.bed.x, 0, layout.bed.z);
  for (const x of [-0.95, 0.95])
    for (const z of [-1.1, 1.15])
      shape(
        "Bed foot",
        "cylinder",
        [x, 0.08, z],
        [0.13, 0.16, 0.13],
        c.darkWood,
        bed,
      );
  shape("Bed frame", "round", [0, 0.3, 0.05], [2.1, 0.32, 2.4], c.wood, bed);
  shape("Mattress", "round", [0, 0.56, 0.08], [1.96, 0.26, 2.26], c.white, bed);
  shape("Duvet", "round", [0, 0.72, 0.42], [2.04, 0.12, 1.62], "#a9bccb", bed);
  shape(
    "Duvet drape",
    "round",
    [0, 0.52, 1.24],
    [2.04, 0.46, 0.07],
    "#a9bccb",
    bed,
  );
  for (const x of [-1.03, 1.03])
    shape(
      "Duvet side",
      "round",
      [x, 0.52, 0.42],
      [0.07, 0.46, 1.62],
      "#a9bccb",
      bed,
    );
  shape(
    "Quilt band",
    "round",
    [0, 0.79, 0.92],
    [2.08, 0.07, 0.48],
    "#e4c27f",
    bed,
  );
  for (let i = 0; i < 5; i++)
    shape(
      "Quilt stitch",
      "box",
      [-0.8 + i * 0.4, 0.83, 0.92],
      [0.18, 0.006, 0.18],
      c.cream,
      bed,
      [0, 45, 0],
    );
  for (const x of [-0.48, 0.48])
    shape(
      "Pillow",
      "round",
      [x, 0.8, -0.78],
      [0.82, 0.24, 0.46],
      c.white,
      bed,
      [-12, x * 8, 0],
    );
  shape(
    "Accent cushion",
    "round",
    [-0.15, 0.9, -0.5],
    [0.5, 0.36, 0.14],
    c.pink,
    bed,
    [-18, 0, 8],
  );
  shape(
    "Round cushion",
    "cylinder",
    [0.35, 0.9, -0.48],
    [0.32, 0.12, 0.32],
    c.gold,
    bed,
    [70, 0, 0],
  );
  shape("Headboard", "round", [0, 0.95, -1.22], [2.25, 1.3, 0.16], c.wood, bed);
  for (let i = 0; i < 4; i++)
    shape(
      "Headboard tuft",
      "round",
      [-0.72 + i * 0.48, 1.05, -1.13],
      [0.44, 0.82, 0.08],
      c.pink,
      bed,
    );
  for (const side of [-1, 1]) {
    const stand = g(
      "Nightstand",
      side < 0 ? layout.nightstandWest.x : layout.nightstandEast.x,
      0,
      layout.nightstandWest.z,
    );
    shape(
      "Nightstand body",
      "round",
      [0, 0.34, 0],
      [0.6, 0.6, 0.5],
      c.wood,
      stand,
    );
    shape(
      "Nightstand drawer",
      "round",
      [0, 0.4, 0.24],
      [0.48, 0.2, 0.03],
      c.cream,
      stand,
    );
    shape(
      "Drawer knob",
      "sphere",
      [0, 0.4, 0.27],
      [0.05, 0.05, 0.04],
      c.darkWood,
      stand,
    );
    for (const x of [-0.22, 0.22])
      shape(
        "Nightstand leg",
        "cylinder",
        [x, 0.03, 0],
        [0.06, 0.08, 0.06],
        c.darkWood,
        stand,
      );
    shape(
      "Lamp base",
      "sphere",
      [side * 0.1, 0.78, -0.05],
      [0.2, 0.24, 0.2],
      c.blue,
      stand,
    );
    shape(
      "Bedside glow",
      "sphere",
      [side * 0.1, 0.98, -0.05],
      [0.13, 0.13, 0.13],
      c.gold,
      stand,
      [],
      0.9,
    );
    b.frustum(
      "Bedside shade",
      [side * 0.1, 1.02, -0.05],
      [0.34, 0.2, 0.34],
      0.6,
      c.cream,
      stand,
    );
    if (side < 0) {
      shape(
        "Bedside book",
        "round",
        [0.12, 0.69, 0.1],
        [0.3, 0.05, 0.22],
        c.sage,
        stand,
        [0, 20, 0],
      );
      shape(
        "Bedside book",
        "round",
        [0.12, 0.74, 0.1],
        [0.27, 0.05, 0.2],
        c.terra,
        stand,
        [0, -8, 0],
      );
    } else {
      shape(
        "Alarm clock",
        "round",
        [-0.13, 0.75, 0.08],
        [0.22, 0.18, 0.12],
        c.terra,
        stand,
      );
      shape(
        "Alarm face",
        "cylinder",
        [-0.13, 0.75, 0.145],
        [0.14, 0.01, 0.14],
        c.cream,
        stand,
        [90, 0, 0],
      );
    }
  }
  art("Artwork · Moon garden", 14.6, 2.4, 1.3, 0.55, (p) => {
    p("Twilight", "box", 0, 0.1, 0, 1.3, 1.2, "#c9d4dc");
    p("Glow band", "box", 0, -0.15, 1, 1.3, 0.3, "#f0d9c8");
    p("Moon", "sphere", 0.28, 0.22, 2, 0.13, 0.3, "#fbf4e6", 0, 0.25);
    p("Far hills", "sphere", -0.2, -0.38, 3, 1, 0.6, "#8ea7a9");
    p("Near hills", "sphere", 0.25, -0.5, 4, 1, 0.55, "#6f8f86");
    for (let i = 0; i < 5; i++) {
      p(
        "Tulip stem",
        "box",
        -0.4 + i * 0.12,
        -0.33,
        5,
        0.008,
        0.18,
        c.sageDark,
      );
      p(
        "Tulip",
        "sphere",
        -0.4 + i * 0.12,
        -0.22,
        6,
        0.05,
        0.1,
        i % 2 ? c.pink : c.gold,
      );
    }
  });
  // Fairy lights sagging along the bedroom wall.
  for (let i = 0; i < 17; i++) {
    const t = i / 16;
    shape(
      "Fairy light",
      "sphere",
      [12.4 + t * 4.4, 3.05 - Math.sin(t * Math.PI * 2) ** 2 * 0.22, -5.74],
      [0.1, 0.1, 0.1],
      [c.gold, c.pink, c.cream][i % 3],
      b.root,
      [],
      0.9,
    );
  }
  // Wardrobe against the left wall.
  const wardrobe = g("Wardrobe", layout.wardrobe.x, 0, layout.wardrobe.z);
  wardrobe.setLocalEulerAngles(0, 90, 0);
  shape(
    "Wardrobe body",
    "round",
    [0, 1.32, 0],
    [1.7, 2.45, 0.7],
    "#e8dcc6",
    wardrobe,
  );
  shape(
    "Wardrobe crown",
    "round",
    [0, 2.6, 0],
    [1.82, 0.1, 0.78],
    c.wood,
    wardrobe,
  );
  for (const x of [-0.42, 0.42]) {
    shape(
      "Wardrobe door",
      "round",
      [x, 1.35, 0.36],
      [0.78, 2.15, 0.04],
      c.wood,
      wardrobe,
    );
    shape(
      "Door panel",
      "round",
      [x, 1.6, 0.385],
      [0.56, 1.1, 0.02],
      "#c99a6f",
      wardrobe,
    );
    shape(
      "Door panel",
      "round",
      [x, 0.7, 0.385],
      [0.56, 0.5, 0.02],
      "#c99a6f",
      wardrobe,
    );
    shape(
      "Wardrobe handle",
      "capsule",
      [x * 0.18, 1.35, 0.42],
      [0.035, 0.26, 0.035],
      c.gold,
      wardrobe,
    );
  }
  for (const x of [-0.75, 0.75])
    shape(
      "Wardrobe foot",
      "cylinder",
      [x, 0.05, 0.25],
      [0.08, 0.1, 0.08],
      c.darkWood,
      wardrobe,
    );
  shape(
    "Hat box",
    "cylinder",
    [-0.3, 2.78, 0],
    [0.42, 0.26, 0.42],
    c.pink,
    wardrobe,
  );
  shape(
    "Hat box",
    "cylinder",
    [0.3, 2.74, 0.05],
    [0.34, 0.18, 0.34],
    c.blue,
    wardrobe,
  );
  // Dresser with a round mirror.
  const dresser = g("Dresser", layout.dresser.x, 0, layout.dresser.z);
  shape(
    "Dresser body",
    "round",
    [0, 0.52, 0],
    [1.3, 0.86, 0.55],
    c.wood,
    dresser,
  );
  for (let r = 0; r < 3; r++)
    for (const x of [-0.31, 0.31]) {
      shape(
        "Dresser drawer",
        "round",
        [x, 0.27 + r * 0.26, 0.27],
        [0.56, 0.21, 0.03],
        c.cream,
        dresser,
      );
      shape(
        "Drawer knob",
        "sphere",
        [x, 0.27 + r * 0.26, 0.3],
        [0.05, 0.05, 0.04],
        c.gold,
        dresser,
      );
    }
  for (const x of [-0.55, 0.55])
    shape(
      "Dresser foot",
      "cylinder",
      [x, 0.05, 0.15],
      [0.08, 0.1, 0.08],
      c.darkWood,
      dresser,
    );
  shape(
    "Mirror frame",
    "cylinder",
    [0, 1.75, -0.24],
    [0.9, 0.05, 0.9],
    c.gold,
    dresser,
    [90, 0, 0],
  );
  shape(
    "Mirror glass",
    "cylinder",
    [0, 1.75, -0.21],
    [0.78, 0.02, 0.78],
    "#d4e3e6",
    dresser,
    [90, 0, 0],
    0.12,
  );
  shape(
    "Mirror glint",
    "capsule",
    [-0.15, 1.88, -0.195],
    [0.04, 0.22, 0.01],
    c.white,
    dresser,
    [0, 0, -35],
    0.3,
  );
  shape(
    "Perfume",
    "round",
    [0.35, 1.05, 0.05],
    [0.12, 0.18, 0.12],
    c.pink,
    dresser,
  );
  shape(
    "Perfume cap",
    "sphere",
    [0.35, 1.18, 0.05],
    [0.07, 0.07, 0.07],
    c.gold,
    dresser,
  );
  shape(
    "Trinket dish",
    "cylinder",
    [-0.05, 0.97, 0.08],
    [0.26, 0.03, 0.26],
    c.cream,
    dresser,
  );
  plant({ x: 11.2, z: -5.5 }, 0.38, 0.95);
  // Rug and pouf in front of the bed.
  shape(
    "Bedroom rug",
    "cylinder",
    [14.4, 0.055, -1.75],
    [3.6, 0.035, 2.7],
    "#b9c7cf",
  );
  shape(
    "Rug inner",
    "cylinder",
    [14.4, 0.075, -1.75],
    [3.1, 0.01, 2.25],
    "#dfe6e2",
  );
  shape(
    "Rug medallion",
    "cylinder",
    [14.4, 0.083, -1.75],
    [1.1, 0.008, 0.85],
    c.pink,
  );
  const pouf = g("Pouf", layout.pouf.x, 0, layout.pouf.z);
  shape("Pouf body", "round", [0, 0.24, 0], [0.75, 0.44, 0.75], c.gold, pouf);
  shape(
    "Pouf tuft",
    "sphere",
    [0, 0.465, 0],
    [0.12, 0.04, 0.12],
    "#d9ad62",
    pouf,
  );
  // Papasan chair, record cabinet and an easel by the cutaway corner.
  const papasan = g("Papasan chair", layout.papasan.x, 0, layout.papasan.z);
  papasan.setLocalEulerAngles(0, 120, 0);
  b.frustum(
    "Rattan base",
    [0, 0.2, 0],
    [0.75, 0.4, 0.75],
    0.65,
    "#c99b62",
    papasan,
  );
  shape(
    "Rattan bowl",
    "sphere",
    [0, 0.55, 0],
    [1.35, 0.5, 1.35],
    "#d2a66d",
    papasan,
  );
  for (let i = 0; i < 3; i++)
    shape(
      "Wicker band",
      "cylinder",
      [0, 0.43 + i * 0.09, 0],
      [1.2 - Math.abs(i - 1) * 0.12, 0.02, 1.2 - Math.abs(i - 1) * 0.12],
      "#b8874f",
      papasan,
    );
  shape(
    "Papasan cushion",
    "sphere",
    [0, 0.72, 0.05],
    [1.18, 0.24, 1.18],
    c.terra,
    papasan,
  );
  shape(
    "Papasan back",
    "round",
    [0, 1.0, -0.42],
    [1.0, 0.62, 0.22],
    c.terra,
    papasan,
    [-28, 0, 0],
  );
  shape(
    "Papasan pillow",
    "round",
    [0.18, 0.95, -0.25],
    [0.42, 0.38, 0.14],
    c.cream,
    papasan,
    [-25, 0, -12],
  );
  const records = g("Record cabinet", layout.records.x, 0, layout.records.z);
  records.setLocalEulerAngles(0, 90, 0);
  shape(
    "Cabinet body",
    "round",
    [0, 0.38, 0],
    [1.2, 0.62, 0.5],
    c.darkWood,
    records,
  );
  for (let i = 0; i < 8; i++)
    shape(
      "Record sleeve",
      "box",
      [-0.45 + i * 0.07, 0.33, 0.12],
      [0.03, 0.42, 0.36],
      [c.sage, c.pink, c.blue, c.gold][i % 4],
      records,
    );
  shape(
    "Turntable plinth",
    "round",
    [0.1, 0.74, 0],
    [0.62, 0.1, 0.44],
    c.wood,
    records,
  );
  shape(
    "Platter",
    "cylinder",
    [0.05, 0.8, 0],
    [0.36, 0.025, 0.36],
    c.ink,
    records,
  );
  shape(
    "Record label",
    "cylinder",
    [0.05, 0.815, 0],
    [0.11, 0.01, 0.11],
    c.terra,
    records,
  );
  shape(
    "Tonearm",
    "capsule",
    [0.28, 0.83, -0.05],
    [0.02, 0.3, 0.02],
    c.cream,
    records,
    [90, -20, 0],
  );
  shape(
    "Small speaker",
    "round",
    [-0.42, 0.85, 0],
    [0.24, 0.32, 0.24],
    c.cream,
    records,
  );
  shape(
    "Speaker cone",
    "cylinder",
    [-0.42, 0.83, 0.125],
    [0.14, 0.01, 0.14],
    c.ink,
    records,
    [90, 0, 0],
  );
  const easel = g("Easel", layout.easel.x, 0, layout.easel.z);
  easel.setLocalEulerAngles(0, -40, 0);
  for (const x of [-0.3, 0.3])
    shape(
      "Easel leg",
      "capsule",
      [x, 0.85, 0.05],
      [0.05, 1.75, 0.05],
      c.wood,
      easel,
      [-8, 0, -x * 25],
    );
  shape(
    "Easel back leg",
    "capsule",
    [0, 0.8, -0.3],
    [0.05, 1.65, 0.05],
    c.wood,
    easel,
    [18, 0, 0],
  );
  shape(
    "Easel ledge",
    "round",
    [0, 0.75, 0.12],
    [0.75, 0.05, 0.12],
    c.wood,
    easel,
  );
  shape(
    "Canvas",
    "round",
    [0, 1.2, 0.08],
    [0.7, 0.85, 0.04],
    c.white,
    easel,
    [-8, 0, 0],
  );
  for (const [px, py, sx, sy, col] of [
    [0, 1.05, 0.62, 0.25, c.blue],
    [-0.12, 1.3, 0.22, 0.22, c.gold],
    [0.15, 1.15, 0.28, 0.16, c.sage],
    [0.05, 1.42, 0.3, 0.12, c.pink],
  ] as [number, number, number, number, string][])
    shape(
      "Paint stroke",
      "sphere",
      [px, py, 0.105],
      [sx, sy, 0.012],
      col,
      easel,
      [-8, 0, 0],
    );
  plant(layout.plantBedroom, 1.1);
  shape(
    "Floor cushion",
    "round",
    [layout.floorCushion.x, 0.1, layout.floorCushion.z],
    [0.7, 0.16, 0.7],
    c.sage,
    b.root,
    [0, 20, 0],
  );
}
