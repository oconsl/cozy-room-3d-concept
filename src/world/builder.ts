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
export const DYNAMIC = "dynamic";
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
  /** Owned materials that are not shared through the cache. */
  private unique: pc.StandardMaterial[] = [];
  private createMaterial(color: string, emission: number) {
    const m = new pc.StandardMaterial();
    m.diffuse = new pc.Color().fromString(color);
    m.gloss = 0.18;
    m.useMetalness = true;
    m.metalness = 0;
    if (emission) {
      m.emissive = new pc.Color().fromString(color);
      m.emissiveIntensity = emission;
    }
    m.update();
    return m;
  }
  /** Shared, immutable material. Never animate its properties. */
  material(color: string, emission = 0) {
    const key = `${color}|${emission}`;
    let m = this.materials.get(key);
    if (!m) {
      m = this.createMaterial(color, emission);
      this.materials.set(key, m);
    }
    return m;
  }
  /** Private material for an entity whose material changes at runtime. */
  ownMaterial(entity: pc.Entity, color: string, emission = 0) {
    const m = this.createMaterial(color, emission);
    this.unique.push(m);
    entity.render!.meshInstances[0].material = m;
    return m;
  }
  /**
   * Entities whose transform or material change at runtime. The static
   * batcher skips them and everything below them.
   */
  dynamic<T extends pc.Entity>(entity: T): T {
    entity.tags.add(DYNAMIC);
    return entity;
  }
  /**
   * Many axis-aligned boxes merged into one mesh per colour: a single entity
   * instead of one per board, with the same look.
   */
  boxes(
    name: string,
    items: { pos: number[]; scale: number[]; color: string }[],
    parent = this.root,
  ) {
    const byColor = new Map<string, typeof items>();
    for (const item of items) {
      const list = byColor.get(item.color) ?? [];
      list.push(item);
      byColor.set(item.color, list);
    }
    const group = this.group(name, 0, 0, 0, parent);
    for (const [color, list] of byColor) {
      const positions: number[] = [],
        normals: number[] = [],
        indices: number[] = [];
      for (const { pos, scale } of list)
        for (let axis = 0; axis < 3; axis++)
          for (const sign of [-1, 1]) {
            const base = positions.length / 3,
              u = (axis + 1) % 3,
              v = (axis + 2) % 3;
            for (const [a, b] of [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ]) {
              const corner = [0, 0, 0],
                normal = [0, 0, 0];
              corner[axis] = sign;
              corner[u] = a;
              corner[v] = b;
              normal[axis] = sign;
              for (let k = 0; k < 3; k++)
                positions.push(pos[k] + (corner[k] * scale[k]) / 2);
              normals.push(...normal);
            }
            if (sign > 0)
              indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
            else
              indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
          }
      const mesh = new pc.Mesh(this.app.graphicsDevice);
      mesh.setPositions(positions);
      mesh.setNormals(normals);
      mesh.setIndices(indices);
      mesh.update(pc.PRIMITIVE_TRIANGLES);
      this.meshes.push(mesh);
      const e = this.group(name, 0, 0, 0, group);
      e.addComponent("render", {
        meshInstances: [new pc.MeshInstance(mesh, this.material(color), e)],
        castShadows: true,
        receiveShadows: true,
      });
    }
    return group;
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
    this.unique.forEach((m) => m.destroy());
    this.meshes.forEach((m) => m.destroy());
  }
}
