import * as pc from "playcanvas";
import { palette as c, type Builder } from "./builder";
import { layout } from "./layout";
import type { Props } from "./props";
export function buildStudio(b: Builder, props: Props) {
  const shape = b.shape.bind(b);
  const g = b.group.bind(b);
  const { legs, mug, plant, shelf, chair, art } = props;
  shape("Diorama · base", "round", [0, -0.37, 0], [12, 0.62, 12], c.cream);
  shape("Floor", "box", [0, -0.055, 0], [11.8, 0.12, 11.8], "#d6b38a");
  const boards = [];
  for (let i = 0; i < 24; i++)
    for (let j = 0; j < 4; j++)
      boards.push({
        pos: [-5.75 + i * 0.5, 0.014, -4.4 + j * 2.95 + (i % 2 ? 0.1 : 0)],
        scale: [0.477, 0.028, 2.91],
        color: ["#dfbf99", "#dfbd93", "#e5c7a4", "#d7b58e"][i % 4],
      });
  b.boxes("Oak floorboards", boards);
  shape("Back wall", "box", [0, 1.55, -5.9], [12, 3.4, 0.22], "#eee2cb");
  shape("Left wall", "box", [-5.9, 1.55, 0], [0.22, 3.4, 12], "#e5dbc6");
  shape("Back trim", "box", [0, 0.17, -5.73], [11.6, 0.22, 0.08], c.white);
  shape("Left trim", "box", [-5.73, 0.17, 0], [0.08, 0.22, 11.6], c.white);
  shape("Back wall cap", "box", [0, 3.27, -5.9], [12, 0.1, 0.32], c.white);
  shape("Left wall cap", "box", [-5.9, 3.27, 0], [0.32, 0.1, 12], c.white);
  // Layered woven rugs anchor the four zones.
  shape(
    "Living rug border",
    "round",
    [-3, 0.05, -1.8],
    [4.65, 0.06, 4.2],
    "#e6d7bd",
  );
  shape(
    "Living rug",
    "round",
    [-3, 0.087, -1.8],
    [4.4, 0.025, 3.95],
    "#f2e6d0",
  );
  for (let i = 0; i < 9; i++)
    shape(
      "Woven stripe",
      "box",
      [-3, 0.104, -3.4 + i * 0.4],
      [4.1, 0.009, 0.035],
      "#d8c6a8",
    );
  shape(
    "Reading rug",
    "cylinder",
    [-3.8, 0.065, 2.5],
    [3.5, 0.045, 3.5],
    "#c4cbb0",
  );
  shape("Social rug", "cylinder", [2.9, 0.063, 2.3], [4, 0.04, 4], "#e6bbaa");
  // Sofa, with separate piping, soft seat cushions and tapered feet.
  const sofa = g("Sofá", layout.sofa.x, 0, layout.sofa.z);
  for (const x of [-1.25, 1.25])
    for (const z of [-0.43, 0.43])
      shape(
        "Sofa foot",
        "cylinder",
        [x, 0.17, z],
        [0.15, 0.34, 0.15],
        c.darkWood,
        sofa,
      );
  shape(
    "Sofa upholstered base",
    "round",
    [0, 0.42, 0],
    [3.35, 0.52, 1.4],
    c.sage,
    sofa,
  );
  shape(
    "Sofa back",
    "round",
    [0, 1.01, -0.5],
    [3.3, 1.03, 0.38],
    c.sage,
    sofa,
    [-8, 0, 0],
  );
  for (const x of [-1.48, 1.48])
    shape(
      "Rolled arm",
      "round",
      [x, 0.79, 0.04],
      [0.36, 0.72, 1.45],
      c.sage,
      sofa,
    );
  for (const x of [-0.7, 0.7]) {
    shape(
      "Seat cushion",
      "round",
      [x, 0.7, 0.16],
      [1.36, 0.24, 1.02],
      "#a8bd98",
      sofa,
    );
    shape(
      "Back cushion",
      "round",
      [x, 1.05, -0.28],
      [1.3, 0.72, 0.24],
      "#a8bd98",
      sofa,
      [-10, 0, 0],
    );
  }
  shape(
    "Blush pillow",
    "round",
    [-1, 1.02, 0.02],
    [0.61, 0.59, 0.22],
    c.pink,
    sofa,
    [0, 0, 14],
  );
  shape(
    "Cream pillow",
    "round",
    [1, 1.02, 0.04],
    [0.58, 0.54, 0.23],
    c.cream,
    sofa,
    [0, 0, -16],
  );
  shape(
    "Throw blanket",
    "round",
    [0.4, 0.84, 0.32],
    [0.54, 0.05, 0.75],
    "#e8d3ac",
    sofa,
  );
  shape(
    "Blanket drape",
    "round",
    [0.4, 0.54, 0.71],
    [0.54, 0.64, 0.04],
    "#e8d3ac",
    sofa,
  );
  const table = g(
    "Coffee table",
    layout.coffeeTable.x,
    0,
    layout.coffeeTable.z,
  );
  legs(table, 1.45, 0.6, 0.55);
  shape(
    "Rounded oak top",
    "round",
    [0, 0.59, 0],
    [2, 0.16, 1.03],
    c.wood,
    table,
  );
  mug(0.45, 0.79, 0.05, table);
  shape(
    "Book on table",
    "round",
    [-0.35, 0.71, 0],
    [0.57, 0.07, 0.4],
    c.terra,
    table,
    [0, 12, 0],
  );
  shape(
    "Book pages",
    "box",
    [-0.35, 0.755, 0],
    [0.5, 0.025, 0.35],
    c.white,
    table,
    [0, 12, 0],
  );
  shape(
    "Ceramic tray",
    "cylinder",
    [0.05, 0.7, -0.2],
    [0.45, 0.04, 0.4],
    c.cream,
    table,
  );
  plant(layout.plantCorner, 1.2);
  const monstera = plant(layout.monstera, 1.2);
  plant(layout.plantReading, 0.9);
  plant(layout.plantSocial, 1.3);
  shelf(layout.tallShelf, 90, 2.2, 1.75);
  shelf(layout.lowShelf, 0, 1.25, 1.4);
  // Work nook.
  const desk = g("Desk", layout.desk.x, 0, layout.desk.z);
  legs(desk, 2.8, 0.8, 1.05);
  shape("Desk top", "round", [0, 1.1, 0], [3.3, 0.16, 1.35], c.wood, desk);
  shape("Desk drawer", "round", [1, 0.84, 0], [0.7, 0.4, 1.1], c.cream, desk);
  shape(
    "Drawer pull",
    "sphere",
    [1, 0.85, 0.57],
    [0.18, 0.07, 0.07],
    c.darkWood,
    desk,
  );
  shape(
    "Monitor stand",
    "round",
    [0, 1.23, -0.15],
    [0.52, 0.1, 0.32],
    c.ink,
    desk,
  );
  shape("Monitor stem", "box", [0, 1.48, -0.25], [0.1, 0.45, 0.1], c.ink, desk);
  shape(
    "Monitor bezel",
    "round",
    [0, 1.8, -0.25],
    [1.35, 0.87, 0.12],
    c.ink,
    desk,
  );
  const screen = b.dynamic(
    shape(
      "Monitor screen",
      "round",
      [0, 1.81, -0.178],
      [1.22, 0.73, 0.012],
      "#59766b",
      desk,
      [],
      0.3,
    ),
  );
  for (let i = 0; i < 3; i++)
    shape(
      "Screen UI line",
      "box",
      [-0.22, 1.98 - i * 0.13, -0.16],
      [0.61 - i * 0.1, 0.032, 0.009],
      "#b3c9ac",
      desk,
      [],
      0.4,
    );
  shape(
    "Keyboard",
    "round",
    [0, 1.22, 0.35],
    [0.95, 0.055, 0.31],
    c.cream,
    desk,
  );
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 3; j++)
      shape(
        "Key",
        "box",
        [-0.4 + i * 0.088, 1.25, 0.25 + j * 0.085],
        [0.06, 0.016, 0.055],
        "#d5cbbb",
        desk,
      );
  mug(0.95, 1.3, 0.3, desk, c.pink);
  shape(
    "Desk notebook",
    "round",
    [-1, 1.22, 0.3],
    [0.48, 0.05, 0.55],
    c.gold,
    desk,
    [0, -12, 0],
  );
  shape(
    "Paper",
    "box",
    [-1, 1.25, 0.3],
    [0.4, 0.01, 0.49],
    c.white,
    desk,
    [0, -12, 0],
  );
  plant({ x: 4.05, z: -4.3 }, 0.45, 1.17);
  chair(layout.deskChair, c.sage, 180);
  shape(
    "Desk lamp stem",
    "capsule",
    [-1.1, 1.51, -0.3],
    [0.055, 0.65, 0.055],
    c.darkWood,
    desk,
    [0, 0, -20],
  );
  b.frustum(
    "Desk lamp shade",
    [-1.02, 1.8, -0.3],
    [0.36, 0.22, 0.36],
    0.55,
    c.gold,
    desk,
  );
  // Reading nook.
  const reading = g(
    "Reading armchair",
    layout.readingChair.x,
    0,
    layout.readingChair.z,
  );
  legs(reading, 1, 0.85, 0.3);
  shape(
    "Chair base",
    "round",
    [0, 0.5, 0],
    [1.45, 0.66, 1.43],
    c.pink,
    reading,
  );
  shape(
    "Reading chair back",
    "round",
    [0, 1.02, -0.5],
    [1.4, 1.25, 0.33],
    c.pink,
    reading,
    [-10, 0, 0],
  );
  for (const x of [-0.64, 0.64])
    shape(
      "Soft arm",
      "round",
      [x, 0.78, 0],
      [0.26, 0.48, 1.35],
      c.pink,
      reading,
    );
  shape(
    "Reading seat",
    "round",
    [0, 0.79, 0.07],
    [1.08, 0.18, 1.02],
    "#ebc4b7",
    reading,
  );
  shape(
    "Reading cushion",
    "round",
    [0, 1.08, -0.25],
    [0.64, 0.55, 0.18],
    c.gold,
    reading,
    [0, 0, 12],
  );
  shape(
    "Reading blanket",
    "round",
    [0.45, 0.96, 0.22],
    [0.4, 0.08, 0.65],
    c.cream,
    reading,
  );
  shape(
    "Blanket fold",
    "round",
    [0.68, 0.68, 0.25],
    [0.045, 0.6, 0.6],
    c.cream,
    reading,
  );
  const side = g("Side table", layout.sideTable.x, 0, layout.sideTable.z);
  shape(
    "Pedestal",
    "cylinder",
    [0, 0.39, 0],
    [0.19, 0.78, 0.19],
    c.darkWood,
    side,
  );
  shape(
    "Side table top",
    "cylinder",
    [0, 0.83, 0],
    [0.78, 0.12, 0.78],
    c.wood,
    side,
  );
  const radio = b.dynamic(
    shape(
      "Vintage radio",
      "round",
      [0, 1.09, 0],
      [0.57, 0.38, 0.29],
      c.terra,
      side,
    ),
  );
  shape(
    "Speaker cloth",
    "round",
    [-0.1, 1.09, 0.152],
    [0.29, 0.25, 0.02],
    c.cream,
    side,
  );
  for (let i = 0; i < 4; i++)
    shape(
      "Speaker line",
      "box",
      [-0.1, 1.015 + i * 0.048, 0.168],
      [0.24, 0.012, 0.008],
      c.wood,
      side,
    );
  shape(
    "Radio dial",
    "sphere",
    [0.2, 1.1, 0.17],
    [0.07, 0.07, 0.03],
    c.gold,
    side,
  );
  shape(
    "Antenna",
    "capsule",
    [0.2, 1.44, -0.08],
    [0.018, 0.45, 0.018],
    c.ink,
    side,
    [0, 0, -15],
  );
  // Social corner.
  const social = g(
    "Social table",
    layout.socialTable.x,
    0,
    layout.socialTable.z,
  );
  b.frustum(
    "Table pedestal",
    [0, 0.48, 0],
    [0.7, 0.96, 0.7],
    0.4,
    c.wood,
    social,
  );
  shape(
    "Round table top",
    "cylinder",
    [0, 1, 0],
    [1.85, 0.14, 1.85],
    c.wood,
    social,
  );
  mug(0.4, 1.2, 0.2, social, c.sage);
  mug(-0.4, 1.2, -0.2, social, c.pink);
  shape(
    "Game board",
    "round",
    [0, 1.1, 0],
    [0.61, 0.035, 0.61],
    c.cream,
    social,
    [0, 15, 0],
  );
  for (let i = 0; i < 5; i++)
    shape(
      "Game piece",
      "sphere",
      [-0.2 + i * 0.1, 1.16, 0.1 * (i % 2)],
      [0.07, 0.07, 0.07],
      i % 2 ? c.terra : c.sage,
      social,
    );
  chair(layout.socialChairWest, c.cream, 90);
  chair(layout.socialChairEast, c.sage, -90);
  const board = g("Whiteboard", layout.whiteboard.x, 0, layout.whiteboard.z);
  shape("Board frame", "round", [0, 1.6, 0], [0.15, 1.6, 1.6], c.wood, board);
  shape(
    "Board surface",
    "round",
    [0.085, 1.6, 0],
    [0.025, 1.42, 1.42],
    c.white,
    board,
  );
  for (const z of [-0.6, 0.6])
    shape(
      "Board leg",
      "capsule",
      [0, 0.5, z],
      [0.06, 1, 0.06],
      c.darkWood,
      board,
    );
  for (let i = 0; i < 4; i++)
    shape(
      "Sticky note",
      "box",
      [0.105, 1.8 - (i % 2) * 0.4, -0.35 + Math.floor(i / 2) * 0.6],
      [0.016, 0.25, 0.32],
      i % 2 ? c.pink : c.gold,
      board,
    );
  // Window, curtains, artwork and clock.
  const window = g("Window", -5.73, 2, 2);
  shape(
    "Window oak frame",
    "round",
    [0, 0, 0],
    [0.13, 1.9, 2.8],
    c.wood,
    window,
  );
  shape(
    "Pastel sky",
    "box",
    [0.075, 0, 0],
    [0.018, 1.65, 2.55],
    c.blue,
    window,
    [],
    0.15,
  );
  shape(
    "Distant hill",
    "sphere",
    [0.095, -0.55, -0.35],
    [0.03, 1, 2],
    c.sage,
    window,
  );
  shape(
    "Sunny hill",
    "sphere",
    [0.11, -0.74, 0.55],
    [0.03, 1.1, 2],
    "#b6c79c",
    window,
  );
  shape(
    "Window sun",
    "sphere",
    [0.115, 0.44, -0.67],
    [0.035, 0.37, 0.37],
    c.gold,
    window,
    [],
    0.4,
  );
  shape(
    "Window center",
    "box",
    [0.15, 0, 0],
    [0.04, 1.76, 0.08],
    c.white,
    window,
  );
  shape(
    "Window sill",
    "round",
    [0.2, -0.94, 0],
    [0.44, 0.12, 3],
    c.white,
    window,
  );
  const curtains: pc.Entity[] = [];
  for (const z of [-1.29, 1.29]) {
    const curtain = b.dynamic(g("Linen curtain", 0.2, 0.05, z, window));
    for (let i = 0; i < 5; i++)
      shape(
        "Curtain fold",
        "capsule",
        [0, 0, -0.2 + i * 0.1],
        [0.15, 1.99, 0.13],
        c.cream,
        curtain,
      );
    curtains.push(curtain);
  }
  art("Artwork · Sunny hills", -3.5, 2.25, 1.05, 0.68, (p) => {
    p("Sky", "box", 0, 0.1, 0, 1.3, 1.2, "#f4e8cc");
    p("Warm horizon", "box", 0, -0.12, 1, 1.3, 0.35, "#f6dcb4");
    p("Sun halo", "sphere", 0.2, 0.18, 2, 0.34, 0.52, "#f7e2a6");
    p("Sun", "sphere", 0.2, 0.18, 3, 0.2, 0.31, c.gold, 0, 0.15);
    p("Cloud", "sphere", -0.27, 0.3, 3, 0.2, 0.13, "#fffaf0");
    p("Cloud", "sphere", -0.18, 0.33, 4, 0.16, 0.16, "#fffaf0");
    p("Cloud", "sphere", -0.12, 0.29, 3, 0.15, 0.1, "#fffaf0");
    p("Far hill", "sphere", 0.2, -0.25, 4, 0.9, 0.62, "#c9d6ab");
    p("Meadow", "box", 0, -0.48, 4, 1.3, 0.2, c.sage);
    p("Middle hill", "sphere", -0.15, -0.3, 5, 0.95, 0.6, c.sage);
    p("Tree trunk", "box", -0.2, 0.0, 6, 0.012, 0.09, c.darkWood);
    p("Tree crown", "sphere", -0.2, 0.06, 7, 0.07, 0.15, c.sageDark);
    p("Tree trunk", "box", -0.08, -0.02, 6, 0.01, 0.07, c.darkWood);
    p("Tree crown", "sphere", -0.08, 0.03, 7, 0.055, 0.12, "#5f8261");
    p("Near hill", "sphere", 0.15, -0.45, 8, 0.95, 0.55, "#7f9d72");
    p("Path", "sphere", 0.12, -0.42, 9, 0.06, 0.3, "#efd9b0", -30);
  });
  art("Artwork · Sprig in a vase", -1.8, 2.3, 0.5, 0.78, (p) => {
    p("Backdrop", "box", 0, 0, 0, 1.4, 1.3, "#f2dcc6");
    p("Arch", "sphere", 0, 0.08, 1, 0.82, 0.62, "#e9c3a8");
    p("Arch base", "box", 0, -0.2, 1, 0.82, 0.5, "#e9c3a8");
    p("Table", "box", 0, -0.42, 2, 1.4, 0.18, "#d9a77e");
    p("Stem", "box", 0, 0.05, 3, 0.022, 0.48, c.sageDark);
    p("Stem", "box", -0.09, 0.08, 3, 0.02, 0.36, c.sageDark, 18);
    p("Stem", "box", 0.1, 0.06, 3, 0.02, 0.32, c.sageDark, -22);
    for (const [lx, ly, r, col] of [
      [-0.08, 0.02, 40, c.sage],
      [0.08, -0.02, -40, c.sage],
      [-0.06, 0.16, 35, "#6f9070"],
      [0.07, 0.13, -35, "#6f9070"],
      [-0.16, 0.2, 50, c.sage],
      [0.17, 0.17, -50, c.sage],
    ] as [number, number, number, string][])
      p("Leaf", "sphere", lx, ly, 4, 0.12, 0.06, col, r);
    p("Bloom", "sphere", 0, 0.3, 5, 0.17, 0.11, c.pink);
    p("Bloom heart", "sphere", 0, 0.3, 6, 0.06, 0.04, c.gold);
    p("Bud", "sphere", -0.15, 0.25, 5, 0.08, 0.055, c.gold);
    p("Bud", "sphere", 0.16, 0.22, 5, 0.08, 0.055, c.pink);
    p("Vase", "sphere", 0, -0.24, 6, 0.36, 0.26, c.terra);
    p("Vase neck", "round", 0, -0.12, 7, 0.16, 0.06, "#b4715a");
    p("Vase stripe", "box", 0, -0.24, 8, 0.33, 0.02, "#f0c9a6");
  });
  art("Artwork · Sailing at dusk", 3.1, 2.4, 1.15, 0.5, (p) => {
    p("Dusk sky", "box", 0, 0.2, 0, 1.3, 0.9, "#f5e3cf");
    p("Peach glow", "box", 0, 0.02, 1, 1.3, 0.22, "#f4cdb5");
    p("Setting sun", "sphere", -0.18, 0.02, 2, 0.24, 0.55, "#efb08f", 0, 0.12);
    p("Cloud", "capsule", 0.25, 0.32, 3, 0.04, 0.3, "#fffaf0", 90);
    p("Cloud", "capsule", 0.33, 0.24, 3, 0.03, 0.2, "#fffaf0", 90);
    p("Far sea", "box", 0, -0.12, 4, 1.3, 0.3, c.blue);
    p("Sun reflection", "box", -0.18, -0.08, 5, 0.18, 0.03, "#f6d2bd");
    p("Sun reflection", "box", -0.18, -0.16, 5, 0.11, 0.025, "#f6d2bd");
    p("Near sea", "box", 0, -0.4, 6, 1.3, 0.4, "#7fa3ac");
    p("Wave", "capsule", -0.32, -0.3, 7, 0.035, 0.2, "#d8e6e3", 90);
    p("Wave", "capsule", 0.05, -0.36, 7, 0.035, 0.16, "#d8e6e3", 90);
    p("Hull", "round", 0.2, -0.05, 8, 0.15, 0.09, c.terra);
    p("Mast", "box", 0.2, 0.12, 8, 0.008, 0.36, c.darkWood);
    p("Mainsail", "cone", 0.17, 0.14, 9, 0.11, 0.38, c.white);
    p("Jib", "cone", 0.245, 0.1, 9, 0.07, 0.28, "#fbefe0");
    p("Gull", "capsule", -0.35, 0.3, 4, 0.012, 0.05, c.ink, 70);
    p("Gull", "capsule", -0.315, 0.3, 4, 0.012, 0.05, c.ink, -70);
  });
  const clockGroup = g("Wall clock", 0.35, 2.55, -5.72);
  shape(
    "Clock frame",
    "cylinder",
    [0, 0, 0],
    [0.57, 0.08, 0.57],
    c.wood,
    clockGroup,
    [90, 0, 0],
  );
  shape(
    "Clock face",
    "cylinder",
    [0, 0, 0.048],
    [0.5, 0.012, 0.5],
    c.cream,
    clockGroup,
    [90, 0, 0],
  );
  shape(
    "Hour hand",
    "box",
    [0.055, 0.06, 0.06],
    [0.015, 0.16, 0.013],
    c.ink,
    clockGroup,
    [0, 0, -45],
  );
  const clock = b.dynamic(g("Minute pivot", 0, 0, 0.065, clockGroup));
  shape("Minute hand", "box", [0, 0.1, 0], [0.014, 0.22, 0.01], c.ink, clock);
  // Standing lamp with real local warm illumination.
  const standingLamp = g("Standing lamp", layout.lamp.x, 0, layout.lamp.z);
  shape(
    "Lamp foot",
    "cylinder",
    [0, 0.07, 0],
    [0.55, 0.1, 0.55],
    c.darkWood,
    standingLamp,
  );
  shape(
    "Lamp stem",
    "cylinder",
    [0, 1.1, 0],
    [0.065, 2.05, 0.065],
    c.wood,
    standingLamp,
  );
  b.frustum(
    "Fabric lampshade",
    [0, 2.15, 0],
    [0.88, 0.55, 0.88],
    0.6,
    c.cream,
    standingLamp,
  );
  const lampBulb = b.dynamic(
    shape(
      "Warm bulb",
      "sphere",
      [0, 1.99, 0],
      [0.24, 0.24, 0.24],
      c.gold,
      standingLamp,
    ),
  );
  // Its emission dims with the light: a private material, not the cache's.
  const bulbMaterial = b.ownMaterial(lampBulb, c.gold, 1);
  const lamp = g("Warm lamp", 0, 1.9, 0, standingLamp);
  lamp.addComponent("light", {
    type: "omni",
    color: new pc.Color(1, 0.77, 0.48),
    range: 5,
    intensity: 1.3,
    castShadows: false,
  });
  return { lamp, bulbMaterial, screen, curtains, clock, radio, monstera };
}
