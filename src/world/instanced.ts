import * as pc from "playcanvas";
import type { Builder } from "./builder";
/**
 * Many copies of one small sphere drawn with a single instanced draw call.
 * `place` writes each instance's position; scale is shared.
 */
export class InstancedCloud {
  readonly entity: pc.Entity;
  private matrices: Float32Array;
  private buffer: pc.VertexBuffer;
  private meshInstance: pc.MeshInstance;
  private matrix = new pc.Mat4();
  private position = new pc.Vec3();
  private rotation = new pc.Quat();
  private scale: pc.Vec3;
  constructor(
    b: Builder,
    name: string,
    readonly count: number,
    scale: [number, number, number],
    material: pc.Material,
  ) {
    const device = b.app.graphicsDevice;
    this.scale = new pc.Vec3(...scale);
    this.entity = b.dynamic(b.group(name));
    this.entity.addComponent("render", {
      type: "sphere",
      material,
      castShadows: false,
      receiveShadows: false,
    });
    this.meshInstance = this.entity.render!.meshInstances[0];
    this.matrices = new Float32Array(count * 16);
    this.buffer = new pc.VertexBuffer(
      device,
      pc.VertexFormat.getDefaultInstancingFormat(device),
      count,
      { usage: pc.BUFFER_DYNAMIC, data: this.matrices },
    );
    // Instances are spread over the room: never frustum-cull the batch.
    this.meshInstance.setInstancing(this.buffer, false);
  }
  set visible(value: boolean) {
    this.entity.enabled = value;
  }
  get visible() {
    return this.entity.enabled;
  }
  place(i: number, x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.matrix.setTRS(this.position, this.rotation, this.scale);
    this.matrices.set(this.matrix.data, i * 16);
  }
  /** Upload the instance matrices written since the last commit. */
  commit() {
    this.buffer.setData(this.matrices);
  }
  destroy() {
    this.meshInstance.setInstancing(null);
    this.buffer.destroy();
  }
}
