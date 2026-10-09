import * as pc from "playcanvas";
import { Builder, buildWorld, palette, type WorldRefs } from "../world/build";
import { DYNAMIC } from "../world/builder";
import { floorAreas, interactions, obstacles, rooms } from "../world/config";
import type { Room } from "../world/layout";
import type { AmbientSettings } from "../world/scripts";
import { AmbientSystem } from "./ambient";
import { Avatar } from "./avatar";
import { AvatarController } from "./avatarController";
import { CozyAudio } from "./audio";
import { Cat } from "./cat";
import { CameraRig } from "./camera";
import { InputController } from "./input";
import { InteractionSystem } from "./interactions";
import { distance, inArea, readSaved } from "./logic";
import { NavGrid } from "./navigation";
import type { Command, GameStore, PanelType, Preferences } from "./store";
export type { Command, Preferences, Snapshot } from "./store";
export { defaults } from "./store";
/**
 * Composition root: builds the scene, wires the systems together and runs
 * them in a fixed order each frame. Game rules live in the systems.
 */
export class Runtime {
  private root: pc.Entity;
  private builder: Builder;
  private world: WorldRefs;
  private avatar: Avatar;
  private controller: AvatarController;
  private cat: Cat;
  private camera: CameraRig;
  private input: InputController;
  private interactions: InteractionSystem;
  private ambient: AmbientSystem;
  private sun: pc.Entity;
  private marker: pc.Entity;
  private audio = new CozyAudio();
  private settings: AmbientSettings = { reduced: false, music: false };
  private preferences: Preferences;
  private room: Room = rooms[0];
  private batchId?: number;
  private panel = false;
  private message = "Tu rincón, tu ritmo.";
  private time = 0;
  private notifyTimer = 0;
  private frames = 0;
  private fpsTime = 0;
  private fps = 60;
  private disposed = false;
  private indicatorAt = { x: 0, y: 0 };
  constructor(
    private app: pc.Application,
    prefs: Preferences,
    private store: GameStore,
    private openPanel: (panel: PanelType) => void,
  ) {
    this.preferences = prefs;
    this.root = new pc.Entity("CozySpace world");
    app.root.addChild(this.root);
    const b = (this.builder = new Builder(app, this.root));
    app.scene.ambientLight = new pc.Color(0.75, 0.72, 0.65);
    app.scene.exposure = 0.9;
    this.camera = new CameraRig(b, app.graphicsDevice);
    this.sun = this.createLights();
    this.world = buildWorld(b);
    this.avatar = new Avatar(b);
    this.cat = new Cat(b);
    this.controller = new AvatarController(new NavGrid(floorAreas, obstacles), {
      x: 0,
      z: 0.3,
    });
    this.marker = b.dynamic(
      b.shape(
        "Destination marker",
        "cylinder",
        [0, 0.04, 0],
        [0.5, 0.025, 0.5],
        palette.gold,
      ),
    );
    this.marker.enabled = false;
    this.ambient = new AmbientSystem(b, this.world, this.settings);
    this.interactions = new InteractionSystem(b, interactions, {
      avatar: this.controller,
      ambient: this.ambient,
      cat: this.cat,
      builder: b,
      world: this.world,
      say: (message) => (this.message = message),
      openPanel: (panel) => this.openPanel(panel),
      toggleSound: () => void this.toggleSound(),
    });
    const lamp = this.interactions.ofType("lamp")!;
    lamp.state = readSaved("lamp", true);
    this.ambient.lampOn = lamp.state;
    this.applyPreferences(prefs);
    this.batchStatics();
    const canvas = app.graphicsDevice.canvas as HTMLCanvasElement;
    canvas.setAttribute(
      "aria-label",
      "Habitación 3D CozySpace. Hacé clic sobre el piso para caminar.",
    );
    canvas.tabIndex = 0;
    this.input = new InputController(canvas, {
      interact: () => this.interact(),
      wave: () => this.wave(),
      click: (x, y) => this.click(x, y),
      zoom: (delta) => this.camera.zoomBy(delta),
    });
    store.attach(this.command);
    app.on("update", this.update);
    this.report();
  }
  private createLights() {
    const sun = this.builder.group("Afternoon sunlight");
    sun.addComponent("light", {
      type: "directional",
      color: new pc.Color(1, 0.9, 0.74),
      intensity: 1.15,
      castShadows: true,
      shadowDistance: 35,
      shadowResolution: 2048,
      shadowBias: 0.2,
      normalOffsetBias: 0.04,
      shadowType: pc.SHADOW_PCF5,
    });
    sun.setLocalEulerAngles(48, -28, -20);
    const fill = this.builder.group("Soft skylight");
    fill.addComponent("light", {
      type: "directional",
      color: new pc.Color(0.76, 0.84, 1),
      intensity: 0.65,
      castShadows: false,
    });
    fill.setLocalEulerAngles(35, 130, 0);
    return sun;
  }
  /** Static geometry is merged; anything tagged dynamic keeps its own draw. */
  private batchStatics() {
    const group = this.app.batcher.addGroup("Cozy static furniture", false, 30);
    this.batchId = group.id;
    for (const render of this.root.findComponents(
      "render",
    ) as pc.RenderComponent[]) {
      let node: pc.GraphNode | null = render.entity;
      let dynamic = false;
      while (node && node !== this.root) {
        if (node.tags.has(DYNAMIC)) {
          dynamic = true;
          break;
        }
        node = node.parent;
      }
      if (!dynamic) render.batchGroupId = group.id;
    }
    this.app.batcher.generate([group.id]);
  }
  command = (command: Command) => {
    switch (command.type) {
      case "interact":
        this.interact();
        break;
      case "visit": {
        const o = this.interactions.find(command.id);
        if (!o) break;
        this.handleGo(this.controller.visit(o));
        this.message = `En camino a ${o.name.toLowerCase()}…`;
        break;
      }
      case "wave":
        this.wave();
        break;
      case "preferences":
        this.applyPreferences(command.value);
        break;
      case "sound":
        void this.toggleSound();
        break;
      case "panel":
        this.panel = command.open;
        this.input.enabled = !command.open;
        this.input.clear();
        break;
    }
  };
  private applyPreferences(prefs: Preferences) {
    this.preferences = prefs;
    this.settings.reduced = prefs.reduced;
    this.camera.follow = prefs.camera === "follow";
    this.audio.volume(prefs.volume);
    const high = prefs.quality === "high";
    this.app.graphicsDevice.maxPixelRatio = high
      ? Math.min(window.devicePixelRatio, 1.7)
      : 1;
    this.sun.light!.castShadows = high;
    this.sun.light!.shadowResolution = high ? 2048 : 512;
  }
  private handleGo(result: ReturnType<AvatarController["go"]>) {
    if (result === "blocked")
      this.message = "Elegí un lugar libre sobre el piso.";
    if (result === "unreachable")
      this.message = "No encuentro un camino a ese lugar.";
  }
  private click(x: number, y: number) {
    if (this.panel || this.controller.seated) return;
    this.controller.pending = undefined;
    this.handleGo(this.controller.go(this.camera.floorAt(x, y)));
  }
  private wave() {
    if (this.panel || !this.controller.wave()) return;
    this.message = "¡Hola! Qué lindo verte por acá.";
  }
  private interact() {
    if (this.panel) return;
    if (this.controller.stand()) {
      this.message = "Un pequeño paseo viene bien.";
      return;
    }
    const o = this.interactions.near;
    if (!o) {
      this.message = "Acercate a un objeto para descubrirlo.";
      return;
    }
    this.controller.pending = o;
    this.handleGo(this.controller.go(o.approach));
  }
  private async toggleSound() {
    if (this.settings.music) {
      this.audio.stop();
      this.settings.music = false;
    } else this.settings.music = await this.audio.play();
    const music = this.settings.music;
    this.interactions.ofType("radio")!.state = music;
    this.message = music ? "Suena «Domingo lento»." : "La radio descansa.";
    this.report();
  }
  private update = (delta: number) => {
    if (this.disposed) return;
    const dt = Math.min(delta, 0.1);
    this.time += dt;
    this.countFrame(delta);
    const c = this.controller;
    const input = this.input.enabled ? this.input.direction() : undefined;
    const step = c.update(dt, input, this.input.sprint);
    if (step.arrived) {
      this.input.clear();
      this.interactions.activate(step.arrived);
    }
    this.marker.enabled = !!c.destination;
    if (c.destination)
      this.marker.setPosition(c.destination.x, 0.043, c.destination.z);
    this.avatar.place(c.position.x, c.position.z, c.angle);
    this.avatar.animate(
      c.state,
      this.time,
      step.speed,
      this.preferences.reduced,
      dt,
      c.seated?.height ?? 0.84,
    );
    this.cat.update(dt, this.preferences.reduced);
    this.updateRoom();
    this.interactions.update(c.position, this.time, this.preferences.reduced);
    this.interactions.ofType("plant")!.state = this.ambient.watered;
    this.camera.update(dt, c.position, this.room);
    this.ambient.update(dt);
    this.projectIndicator();
    this.notifyTimer += dt;
    if (this.notifyTimer > 0.1) {
      this.notifyTimer = 0;
      this.report();
    }
  };
  private countFrame(delta: number) {
    this.frames++;
    this.fpsTime += delta;
    if (this.fpsTime > 0.5) {
      this.fps = Math.round(this.frames / this.fpsTime);
      this.fpsTime = 0;
      this.frames = 0;
    }
  }
  /** Rooms only change at thresholds: keep the current one while inside. */
  private updateRoom() {
    const p = this.controller.position;
    if (inArea(p, this.room.area)) return;
    // In the hallway the camera frames whichever room is closer.
    let best = this.room;
    for (const r of rooms) {
      if (inArea(p, r.area)) {
        best = r;
        break;
      }
      if (distance(p, r.center) < distance(p, best.center)) best = r;
    }
    this.room = best;
  }
  private projectIndicator() {
    const near = this.interactions.near;
    if (!near) {
      if (this.store.indicator) this.store.moveIndicator(undefined);
      return;
    }
    const s = this.camera.toScreen(
      near.position.x,
      this.controller.seated ? 2.55 : 1.65,
      near.position.z,
    );
    this.indicatorAt.x = s.x;
    this.indicatorAt.y = s.y;
    this.store.moveIndicator(this.indicatorAt);
  }
  private report() {
    const c = this.controller,
      near = this.interactions.near;
    this.store.publish({
      ready: true,
      position: { ...c.position },
      state: c.state,
      near: near?.id,
      nearName: near?.name,
      fps: this.fps,
      lamp: this.ambient.lampOn,
      music: this.settings.music,
      target: c.path.at(-1),
      message: this.message,
      room: { name: this.room.name, mood: this.room.mood },
    });
  }
  destroy() {
    this.disposed = true;
    this.store.attach(undefined);
    this.input.destroy();
    this.app.off("update", this.update);
    this.audio.destroy();
    this.ambient.destroy();
    if (this.batchId !== undefined) this.app.batcher.removeGroup(this.batchId);
    this.root.destroy();
    this.builder.destroy();
  }
}
