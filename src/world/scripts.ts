import * as pc from "playcanvas";
/** Shared, mutable switches every ambient script reads each frame. */
export interface AmbientSettings {
  reduced: boolean;
  music: boolean;
}
abstract class AmbientScript extends pc.Script {
  settings!: AmbientSettings;
  protected time = 0;
  update(dt: number) {
    this.time += dt;
    this.tick();
  }
  protected abstract tick(): void;
}
/** Gentle breeze for foliage and curtains, phase-shifted per entity. */
export class Sway extends AmbientScript {
  static scriptName = "sway";
  phase = 0;
  pitch: [number, number] = [0.8, 1.4];
  roll: [number, number] = [0.7, 1.3];
  protected tick() {
    if (this.settings.reduced) return;
    const t = this.time;
    this.entity.setLocalEulerAngles(
      Math.sin(t * this.pitch[0] + this.phase) * this.pitch[1],
      0,
      this.roll[1] ? Math.cos(t * this.roll[0] + this.phase) * this.roll[1] : 0,
    );
  }
}
/** Continuous rotation around Z, like a clock hand. */
export class Spin extends AmbientScript {
  static scriptName = "spin";
  speed = 0.6;
  protected tick() {
    this.entity.setLocalEulerAngles(0, 0, -this.time * this.speed);
  }
}
/** Bobbing to the beat while music plays. */
export class Groove extends AmbientScript {
  static scriptName = "groove";
  protected tick() {
    const on = this.settings.music && !this.settings.reduced;
    this.entity.setLocalEulerAngles(
      0,
      0,
      on ? Math.sin(this.time * 4) * 1.5 : 0,
    );
  }
}
/** Attach an ambient script with its settings and per-instance properties. */
export function attach<T extends AmbientScript>(
  entity: pc.Entity,
  type: new (...args: never[]) => T,
  settings: AmbientSettings,
  properties: Partial<Omit<T, keyof pc.Script>> = {},
) {
  if (!entity.script) entity.addComponent("script");
  return entity.script!.create(
    type as unknown as new (...args: unknown[]) => T,
    { properties: { settings, ...properties } },
  );
}
