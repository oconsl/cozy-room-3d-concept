import * as pc from "playcanvas";
import type { Builder } from "../world/builder";
import type { Room } from "../world/layout";
import type { Point } from "./types";
const OFFSET = new pc.Vec3(13, 12.3, 13);
const FLOOR_Y = 0.03;
/** Isometric orthographic camera that frames the current room. */
export class CameraRig {
  readonly entity: pc.Entity;
  zoom = 9.2;
  follow = false;
  // Scratch vectors: the rig never allocates per frame.
  private target = new pc.Vec3();
  private desired = new pc.Vec3();
  private current = new pc.Vec3();
  private near = new pc.Vec3();
  private far = new pc.Vec3();
  private world = new pc.Vec3();
  private screen = new pc.Vec3();
  constructor(
    b: Builder,
    private device: pc.GraphicsDevice,
  ) {
    this.entity = b.group("Isometric camera");
    this.entity.addComponent("camera", {
      projection: pc.PROJECTION_ORTHOGRAPHIC,
      toneMapping: pc.TONEMAP_ACES,
      orthoHeight: 9.2,
      nearClip: 0.1,
      farClip: 100,
      clearColor: new pc.Color().fromString("#eee9df"),
    });
    this.entity.setPosition(13, 13, 13);
    this.entity.lookAt(0, 0.7, 0);
  }
  private get camera() {
    return this.entity.camera!;
  }
  zoomBy(delta: number) {
    this.zoom = pc.math.clamp(this.zoom + delta * 0.004, 6.7, 11);
  }
  update(dt: number, focus: Point, room: Room) {
    const c = room.center;
    const f = this.follow ? 0.65 : 0;
    this.target.set(c.x + (focus.x - c.x) * f, 0.7, c.z + (focus.z - c.z) * f);
    this.desired.add2(this.target, OFFSET);
    this.current.copy(this.entity.getPosition());
    this.current.lerp(this.current, this.desired, 1 - Math.exp(-dt * 2.2));
    this.entity.setPosition(this.current);
    this.target.sub2(this.current, OFFSET);
    this.entity.lookAt(this.target);
    const aspect = this.device.width / this.device.height;
    const height = Math.max(this.zoom, 12 / aspect) * room.scale;
    this.camera.orthoHeight = pc.math.lerp(
      this.camera.orthoHeight,
      this.follow ? height * 0.76 : height,
      1 - Math.exp(-dt * 3),
    );
  }
  /** Floor point under a canvas pixel (CSS units). */
  floorAt(x: number, y: number): Point {
    const a = this.camera.screenToWorld(x, y, 1, this.near);
    const z = this.camera.screenToWorld(x, y, 80, this.far);
    const t = (FLOOR_Y - a.y) / (z.y - a.y);
    return { x: a.x + (z.x - a.x) * t, z: a.z + (z.z - a.z) * t };
  }
  /** Canvas pixel of a world point; the result is reused between calls. */
  toScreen(x: number, y: number, z: number) {
    this.world.set(x, y, z);
    return this.camera.worldToScreen(this.world, this.screen);
  }
}
