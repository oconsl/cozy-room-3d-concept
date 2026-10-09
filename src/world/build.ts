import * as pc from "playcanvas";
export const palette = {
  cream: "#f6edda",
  wood: "#bd8b60",
  darkWood: "#785642",
  sage: "#91aa86",
  sageDark: "#4f7056",
  pink: "#dca9a0",
  terra: "#c58466",
  gold: "#efcb82",
  white: "#fff8ea",
  ink: "#4d4a40",
  blue: "#a3bfc4",
};
export class Builder {
  materials = new Map<string, pc.StandardMaterial>();
  meshes: pc.Mesh[] = [];
  frustums = new Map<string, pc.Mesh>();
  rounded: pc.Mesh;
  constructor(
    public app: pc.Application,
    public root: pc.Entity,
  ) {
    this.rounded = this.roundMesh();
    this.meshes.push(this.rounded);
  }
  material(color: string, emission = 0) {
    const key = color + emission;
    let m = this.materials.get(key);
    if (!m) {
      m = new pc.StandardMaterial();
      m.diffuse = new pc.Color().fromString(color);
      m.gloss = 0.18;
      m.useMetalness = true;
      m.metalness = 0;
      if (emission) {
        m.emissive = new pc.Color().fromString(color);
        m.emissiveIntensity = emission;
      }
      m.update();
      this.materials.set(key, m);
    }
    return m;
  }
  group(name: string, x = 0, y = 0, z = 0, parent = this.root) {
    const e = new pc.Entity(name);
    parent.addChild(e);
    e.setLocalPosition(x, y, z);
    return e;
  }
  shape(
    name: string,
    kind: "box" | "sphere" | "cylinder" | "cone" | "capsule" | "round",
    pos: number[],
    scale: number[],
    color: string,
    parent = this.root,
    rotation: number[] = [],
    emission = 0,
  ) {
    const e = this.group(name, pos[0], pos[1], pos[2], parent);
    const mat = this.material(color, emission);
    if (kind === "round") {
      e.addComponent("render", {
        meshInstances: [new pc.MeshInstance(this.rounded, mat, e)],
        castShadows: true,
        receiveShadows: true,
      });
    } else
      e.addComponent("render", {
        type: kind,
        material: mat,
        castShadows: true,
        receiveShadows: true,
      });
    e.setLocalScale(scale[0], scale[1], scale[2]);
    if (rotation.length)
      e.setLocalEulerAngles(rotation[0], rotation[1], rotation[2]);
    return e;
  }
  roundMesh() {
    const positions: number[] = [],
      normals: number[] = [],
      indices: number[] = [];
    const n = 6,
      r = 0.16;
    for (let face = 0; face < 6; face++) {
      const axis = Math.floor(face / 2),
        sign = face % 2 ? 1 : -1,
        base = positions.length / 3;
      for (let j = 0; j <= n; j++)
        for (let i = 0; i <= n; i++) {
          const v = [0, 0, 0];
          v[axis] = sign * 0.5;
          v[(axis + 1) % 3] = i / n - 0.5;
          v[(axis + 2) % 3] = j / n - 0.5;
          const inner = v.map((x) => Math.max(-0.5 + r, Math.min(0.5 - r, x)));
          const delta = v.map((x, k) => x - inner[k]);
          const l = Math.hypot(...delta);
          positions.push(...inner.map((x, k) => x + (delta[k] / l) * r));
          normals.push(...delta.map((x) => x / l));
        }
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const a = base + j * (n + 1) + i,
            b = a + 1,
            c = a + n + 1,
            d = c + 1;
          if (sign > 0) indices.push(a, b, c, b, d, c);
          else indices.push(a, c, b, b, c, d);
        }
    }
    const mesh = new pc.Mesh(this.app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setIndices(indices);
    mesh.update(pc.PRIMITIVE_TRIANGLES);
    return mesh;
  }
  // Truncated cone: flat top whose radius is `top` times the base radius.
  frustum(
    name: string,
    pos: number[],
    scale: number[],
    top: number,
    color: string,
    parent = this.root,
  ) {
    const key = "frustum" + top;
    let mesh = this.frustums.get(key);
    if (!mesh) {
      mesh = pc.Mesh.fromGeometry(
        this.app.graphicsDevice,
        new pc.ConeGeometry({
          baseRadius: 0.5,
          peakRadius: 0.5 * top,
          height: 1,
          capSegments: 24,
        }),
      );
      this.frustums.set(key, mesh);
      this.meshes.push(mesh);
    }
    const e = this.group(name, pos[0], pos[1], pos[2], parent);
    e.addComponent("render", {
      meshInstances: [new pc.MeshInstance(mesh, this.material(color), e)],
      castShadows: true,
      receiveShadows: true,
    });
    e.setLocalScale(scale[0], scale[1], scale[2]);
    return e;
  }
  destroy() {
    this.materials.forEach((m) => m.destroy());
    this.meshes.forEach((m) => m.destroy());
  }
}
export interface WorldRefs {
  lamp: pc.Entity;
  lampBulb: pc.Entity;
  screen: pc.Entity;
  plants: pc.Entity[];
  curtains: pc.Entity[];
  clock: pc.Entity;
  water: pc.Entity[];
  radio: pc.Entity;
}
export function buildWorld(b: Builder): WorldRefs {
  const c = palette;
  const shape = b.shape.bind(b);
  const g = b.group.bind(b);
  shape("Diorama · base", "round", [0, -0.37, 0], [12, 0.62, 12], c.cream);
  shape("Floor", "box", [0, -0.055, 0], [11.8, 0.12, 11.8], "#d6b38a");
  for (let i = 0; i < 24; i++) {
    const x = -5.75 + i * 0.5;
    for (let j = 0; j < 4; j++)
      shape(
        "Oak floorboard",
        "box",
        [x, 0.014, -4.4 + j * 2.95 + (i % 2 ? 0.1 : 0)],
        [0.477, 0.028, 2.91],
        ["#dfbf99", "#dfbd93", "#e5c7a4", "#d7b58e"][i % 4],
      );
  }
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
  const sofa = g("Sofá", -3.3, 0, -3.5);
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
  const table = g("Coffee table", -3.2, 0, -1.25);
  legs(table, 1.45, 0.6, 0.55);
  shape(
    "Rounded oak top",
    "round",
    [0, 0.59, 0],
    [2, 0.16, 1.03],
    c.wood,
    table,
  );
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
  const plants: pc.Entity[] = [];
  const plant = (x: number, z: number, size = 1, y = 0) => {
    const p = g("Plant", x, y, z);
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
    const leaves = g("Foliage", 0, 0.45, 0, p);
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
  plant(-5, -4.7, 1.2);
  plant(0.1, -4.7, 1.2);
  plant(-3.4, 4.85, 0.9);
  plant(4.9, 4.5, 1.3);
  const shelf = (
    x: number,
    z: number,
    angle = 0,
    height = 2.1,
    width = 1.7,
  ) => {
    const p = g("Bookshelf", x, 0, z);
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
  shelf(-5, -0.2, 90, 2.2, 1.75);
  shelf(-4.7, 4.4, 0, 1.25, 1.4);
  // Work nook.
  const desk = g("Desk", 2.8, 0, -4);
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
  const screen = shape(
    "Monitor screen",
    "round",
    [0, 1.81, -0.178],
    [1.22, 0.73, 0.012],
    "#59766b",
    desk,
    [],
    0.3,
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
  plant(4.05, -4.3, 0.45, 1.17);
  const chair = (x: number, z: number, color: string, angle = 0) => {
    const p = g("Chair", x, 0, z);
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
  chair(2.8, -2.5, c.sage, 180);
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
  const reading = g("Reading armchair", -4, 0, 2.2);
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
  const side = g("Side table", -2.5, 0, 2.5);
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
  const radio = shape(
    "Vintage radio",
    "round",
    [0, 1.09, 0],
    [0.57, 0.38, 0.29],
    c.terra,
    side,
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
  const social = g("Social table", 2.9, 0, 2.3);
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
  chair(1.5, 2.3, c.cream, 90);
  chair(4.3, 2.3, c.sage, -90);
  const board = g("Whiteboard", 5.25, 0, 1);
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
    const curtain = g("Linen curtain", 0.2, 0.05, z, window);
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
  const clock = g("Minute pivot", 0, 0, 0.065, clockGroup);
  shape("Minute hand", "box", [0, 0.1, 0], [0.014, 0.22, 0.01], c.ink, clock);
  // Standing lamp with real local warm illumination.
  shape(
    "Lamp foot",
    "cylinder",
    [-1, 0.07, -4.3],
    [0.55, 0.1, 0.55],
    c.darkWood,
  );
  shape("Lamp stem", "cylinder", [-1, 1.1, -4.3], [0.065, 2.05, 0.065], c.wood);
  b.frustum(
    "Fabric lampshade",
    [-1, 2.15, -4.3],
    [0.88, 0.55, 0.88],
    0.6,
    c.cream,
  );
  const lampBulb = shape(
    "Warm bulb",
    "sphere",
    [-1, 1.99, -4.3],
    [0.24, 0.24, 0.24],
    c.gold,
    b.root,
    [],
    1,
  );
  const lamp = g("Warm lamp", -1, 1.9, -4.3);
  lamp.addComponent("light", {
    type: "omni",
    color: new pc.Color(1, 0.77, 0.48),
    range: 5,
    intensity: 1.3,
    castShadows: false,
  });
  const water: pc.Entity[] = [];
  for (let i = 0; i < 12; i++) {
    const drop = shape(
      "Water droplet",
      "sphere",
      [0.1, 1.9, -4.7],
      [0.045, 0.09, 0.045],
      c.blue,
      b.root,
      [],
      0.25,
    );
    drop.enabled = false;
    water.push(drop);
  }
  // Hallway towards the bedroom: full-height back wall, low cutaway front.
  shape("Hallway base", "round", [7.75, -0.33, -1], [3.9, 0.52, 1.9], c.cream);
  shape(
    "Hallway floor",
    "box",
    [7.75, -0.055, -1],
    [3.8, 0.12, 1.6],
    "#d6b38a",
  );
  for (let k = 0; k < 4; k++)
    shape(
      "Oak floorboard",
      "box",
      [7.75, 0.014, -1.6 + k * 0.4],
      [3.76, 0.028, 0.38],
      ["#dfbf99", "#e5c7a4", "#d7b58e", "#dfbd93"][k],
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
  plant(6.6, -0.09, 0.32, 0.665);
  plant(8.9, -0.09, 0.32, 0.665);
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

  // Bedroom: twilight blues and blush walls, bed, wardrobe and a quiet corner.
  const bx = 13.6,
    bz = -1.9;
  shape("Bedroom base", "round", [bx, -0.37, bz], [8.2, 0.62, 8.2], c.cream);
  shape("Bedroom floor", "box", [bx, -0.055, bz], [8, 0.12, 8], "#d6b38a");
  for (let j = 0; j < 16; j++) {
    const z = -5.65 + j * 0.5,
      seam = bx + ((j % 3) - 1) * 1.6;
    const tones = ["#e3c6a0", "#dcbb93", "#e7cdaa", "#d9b88f"];
    shape(
      "Bedroom board",
      "box",
      [(9.62 + seam) / 2, 0.014, z],
      [seam - 9.63, 0.028, 0.477],
      tones[j % 4],
    );
    shape(
      "Bedroom board",
      "box",
      [(seam + 17.58) / 2, 0.014, z],
      [17.57 - seam, 0.028, 0.477],
      tones[(j + 2) % 4],
    );
  }
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
  const bed = g("Bed", 14.6, 0, -4.55);
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
    const stand = g("Nightstand", side < 0 ? 13.15 : 16.05, 0, -5.45);
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
  const wardrobe = g("Wardrobe", 10.1, 0, -4.2);
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
  const dresser = g("Dresser", 11.6, 0, -5.5);
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
  plant(11.2, -5.5, 0.38, 0.95);
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
  const pouf = g("Pouf", 16.5, 0, -1.9);
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
  const papasan = g("Papasan chair", 11.3, 0, 0.6);
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
  const records = g("Record cabinet", 10.05, 0, 1.4);
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
  const easel = g("Easel", 16.7, 0, 0.9);
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
  plant(17.05, -5.2, 1.1);
  shape(
    "Floor cushion",
    "round",
    [16.6, 0.1, -0.55],
    [0.7, 0.16, 0.7],
    c.sage,
    b.root,
    [0, 20, 0],
  );
  return { lamp, lampBulb, screen, plants, curtains, clock, water, radio };
}
