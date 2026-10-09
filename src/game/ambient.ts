import * as pc from "playcanvas";
import { palette, type Builder, type WorldRefs } from "../world/build";
import { InstancedCloud } from "../world/instanced";
import {
  attach,
  Groove,
  Spin,
  Sway,
  type AmbientSettings,
} from "../world/scripts";
const LAMP_INTENSITY = 1.3;
/**
 * Room life that depends on game state: lamp fade, watering and floating
 * dust. Self-contained loops (breeze, clock, radio) run as engine scripts.
 */
export class AmbientSystem {
  lampOn = true;
  private time = 0;
  private waterUntil = 0;
  private growth = 0;
  private lampIntensity = LAMP_INTENSITY;
  private foliage: pc.Entity;
  private dust: InstancedCloud;
  private water: InstancedCloud;
  constructor(
    b: Builder,
    private world: WorldRefs,
    private settings: AmbientSettings,
  ) {
    world.plants.forEach((p, i) => attach(p, Sway, settings, { phase: i }));
    world.curtains.forEach((p, i) =>
      attach(p, Sway, settings, { phase: i, pitch: [0.6, 1.1], roll: [0, 0] }),
    );
    attach(world.clock, Spin, settings);
    attach(world.radio, Groove, settings);
    this.foliage = world.monstera.findByName("Foliage") as pc.Entity;
    this.dust = new InstancedCloud(
      b,
      "Sunlit dust",
      18,
      [0.017, 0.017, 0.017],
      b.material(palette.cream, 0.4),
    );
    this.water = new InstancedCloud(
      b,
      "Water droplets",
      12,
      [0.045, 0.09, 0.045],
      b.material(palette.blue, 0.25),
    );
    this.water.visible = false;
    this.placeDust();
  }
  get watered() {
    return this.time < this.waterUntil;
  }
  startWatering() {
    this.waterUntil = this.time + 3;
  }
  update(dt: number) {
    this.time += dt;
    const k = (rate: number) => 1 - Math.exp(-dt * rate);
    const target = this.lampOn ? LAMP_INTENSITY : 0;
    if (Math.abs(this.lampIntensity - target) > 1e-3) {
      this.lampIntensity = pc.math.lerp(this.lampIntensity, target, k(4));
      this.world.lamp.light!.intensity = this.lampIntensity;
      // Only touch the material while the fade is running.
      this.world.bulbMaterial.emissiveIntensity =
        this.lampIntensity / LAMP_INTENSITY;
      this.world.bulbMaterial.update();
    }
    const watered = this.watered;
    const growthTarget = watered ? 0.1 : 0;
    if (Math.abs(this.growth - growthTarget) > 1e-4) {
      this.growth = pc.math.lerp(this.growth, growthTarget, k(5));
      const g = this.growth;
      this.foliage.setLocalScale(1 + g * 0.3, 1 + g, 1 + g * 0.3);
    }
    this.water.visible = watered;
    if (watered) {
      for (let i = 0; i < this.water.count; i++) {
        const u = (this.time * 1.2 + i / 12) % 1;
        this.water.place(
          i,
          0.1 + Math.cos(i * 2.4) * u * 0.3,
          1.9 - u * 1.35,
          -4.7 + Math.sin(i * 2.4) * u * 0.3,
        );
      }
      this.water.commit();
    }
    if (!this.settings.reduced) this.placeDust();
  }
  private placeDust() {
    const t = this.time;
    for (let i = 0; i < this.dust.count; i++)
      this.dust.place(
        i,
        -4.5 + (i % 6) * 0.22 + Math.sin(t * 0.2 + i) * 0.1,
        0.5 + Math.floor(i / 6) * 0.5 + Math.sin(t * 0.4 + i) * 0.12,
        1.5 + (i % 3) * 0.4,
      );
    this.dust.commit();
  }
  destroy() {
    this.dust.destroy();
    this.water.destroy();
  }
}
