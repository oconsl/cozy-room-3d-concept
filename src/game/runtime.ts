import * as pc from "playcanvas";
import { Builder, buildWorld, palette, type WorldRefs } from "../world/build";
import { Avatar } from "./avatar";
import {
  cameraDirection,
  inArea,
  moveKinematic,
  distance,
  nearest,
  pathfind,
  readSaved,
  save,
  transition,
  walkable,
  type AvatarState,
  type Interactive,
  type Point,
} from "./logic";
import { interactions, obstacles, rooms, type Room } from "../world/config";
import { CozyAudio } from "./audio";
export interface Preferences {
  camera: "general" | "follow";
  quality: "high" | "low";
  reduced: boolean;
  volume: number;
  fps: boolean;
}
export interface Snapshot {
  ready: boolean;
  position: Point;
  state: AvatarState;
  near?: string;
  nearName?: string;
  fps: number;
  lamp: boolean;
  music: boolean;
  target?: Point;
  indicator?: { x: number; y: number };
  message: string;
  room: { name: string; mood: string };
}
export type Command =
  | { type: "interact" }
  | { type: "visit"; id: string }
  | { type: "wave" }
  | { type: "preferences"; value: Preferences }
  | { type: "sound" }
  | { type: "panel"; open: boolean };
export interface Bridge {
  command?: (command: Command) => void;
}
export const defaults: Preferences = {
  camera: "general",
  quality: "high",
  reduced: false,
  volume: 0.25,
  fps: false,
};
export class Runtime {
  root: pc.Entity;
  builder: Builder;
  world: WorldRefs;
  avatar: Avatar;
  camera: pc.Entity;
  sun: pc.Entity;
  marker: pc.Entity;
  highlight: pc.Entity;
  poseTravel?: { from: Point; to: Point; elapsed: number; duration: number };
  state: AvatarState = "IDLE";
  position: Point = { x: 0, z: 0.3 };
  room: Room = rooms[0];
  objects = interactions.map((o) => ({ ...o }));
  path: Point[] = [];
  pending?: Interactive;
  destinationAfterStand?: Point;
  seated?: Interactive;
  near?: Interactive;
  time = 0;
  timer = 0;
  notifyTimer = 0;
  angle = 0;
  preferences: Preferences;
  keys = new Set<string>();
  audio = new CozyAudio();
  music = false;
  panel = false;
  message = "Tu rincón, tu ritmo.";
  waterUntil = 0;
  plantGrowth = 0;
  lampIntensity = 1.3;
  disposed = false;
  frames = 0;
  fpsTime = 0;
  fps = 60;
  constructor(
    private app: pc.Application,
    prefs: Preferences,
    private emit: (snapshot: Snapshot) => void,
    private openPanel: (type: string) => void,
  ) {
    this.preferences = prefs;
    this.root = new pc.Entity("CozySpace world");
    app.root.addChild(this.root);
    this.builder = new Builder(app, this.root);
    app.scene.ambientLight = new pc.Color(0.75, 0.72, 0.65);
    app.scene.exposure = 0.9;
    this.camera = this.builder.group("Isometric camera");
    this.camera.addComponent("camera", {
      projection: pc.PROJECTION_ORTHOGRAPHIC,
      toneMapping: pc.TONEMAP_ACES,
      orthoHeight: 9.2,
      nearClip: 0.1,
      farClip: 100,
      clearColor: new pc.Color().fromString("#eee9df"),
    });
    this.camera.setPosition(13, 13, 13);
    this.camera.lookAt(0, 0.7, 0);
    this.sun = this.builder.group("Afternoon sunlight");
    this.sun.addComponent("light", {
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
    this.sun.setLocalEulerAngles(48, -28, -20);
    const fill = this.builder.group("Soft skylight");
    fill.addComponent("light", {
      type: "directional",
      color: new pc.Color(0.76, 0.84, 1),
      intensity: 0.65,
      castShadows: false,
    });
    fill.setLocalEulerAngles(35, 130, 0);
    this.world = buildWorld(this.builder);
    this.avatar = new Avatar(this.builder);
    this.marker = this.builder.shape(
      "Destination marker",
      "cylinder",
      [0, 0.04, 0],
      [0.5, 0.025, 0.5],
      palette.gold,
    );
    this.marker.enabled = false;
    this.highlight = this.builder.shape(
      "Interaction halo",
      "cylinder",
      [0, 0.045, 0],
      [0.7, 0.015, 0.7],
      palette.gold,
    );
    this.highlight.enabled = false;
    const lamp = this.objects.find((o) => o.id === "lamp")!;
    lamp.state = readSaved("lamp", true);
    this.applyPreferences(prefs);
    for (let i = 0; i < 18; i++) {
      const dust = this.builder.shape(
        "Sunlit dust",
        "sphere",
        [
          -4.5 + (i % 6) * 0.22,
          0.5 + Math.floor(i / 6) * 0.5,
          1.5 + (i % 3) * 0.4,
        ],
        [0.017, 0.017, 0.017],
        palette.cream,
        this.root,
        [],
        0.4,
      );
      this.dust.push(dust);
    }
    this.batchStatics();
    app.graphicsDevice.canvas.setAttribute(
      "aria-label",
      "Habitación 3D CozySpace. Hacé clic sobre el piso para caminar.",
    );
    app.graphicsDevice.canvas.tabIndex = 0;
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
    window.addEventListener("blur", this.blur);
    app.graphicsDevice.canvas.addEventListener("pointerdown", this.pointer);
    app.graphicsDevice.canvas.addEventListener("wheel", this.wheel, {
      passive: false,
    });
    app.on("update", this.update);
    this.report();
  }
  batchId?: number;
  batchStatics() {
    const group = this.app.batcher.addGroup("Cozy static furniture", false, 30);
    this.batchId = group.id;
    const dynamicNames = [
      "Avatar · Nilo",
      "Foliage",
      "Linen curtain",
      "Sunlit dust",
      "Water droplet",
      "Monitor screen",
      "Warm bulb",
      "Vintage radio",
      "Minute pivot",
      "Destination marker",
      "Interaction halo",
    ];
    for (const render of this.root.findComponents(
      "render",
    ) as pc.RenderComponent[]) {
      let node: pc.GraphNode | null = render.entity;
      let dynamic = false;
      while (node && node !== this.root) {
        if (dynamicNames.includes(node.name)) {
          dynamic = true;
          break;
        }
        node = node.parent;
      }
      if (!dynamic) render.batchGroupId = group.id;
    }
    this.app.batcher.generate([group.id]);
  }
  dust: pc.Entity[] = [];
  zoom = 9.2;
  private editable() {
    const element = document.activeElement;
    return (
      element instanceof HTMLElement &&
      !!element.closest('input,textarea,select,[contenteditable="true"]')
    );
  }
  keydown = (e: KeyboardEvent) => {
    if (this.panel || this.editable()) return;
    const key = e.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
      ].includes(key)
    )
      e.preventDefault();
    this.keys.add(key);
    if (!e.repeat && key === "e") this.interact();
    if (!e.repeat && key === "q") this.wave();
  };
  keyup = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
  blur = () => {
    this.keys.clear();
  };
  pointer = (e: PointerEvent) => {
    if (e.button !== 0 || this.panel || this.seated) return;
    const rect = this.app.graphicsDevice.canvas.getBoundingClientRect();
    const a = this.camera.camera!.screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      1,
    );
    const z = this.camera.camera!.screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      80,
    );
    const t = (0.03 - a.y) / (z.y - a.y);
    const p = { x: a.x + (z.x - a.x) * t, z: a.z + (z.z - a.z) * t };
    this.pending = undefined;
    this.go(p);
  };
  wheel = (e: WheelEvent) => {
    e.preventDefault();
    this.zoom = pc.math.clamp(this.zoom + e.deltaY * 0.004, 6.7, 11);
  };
  command = (command: Command) => {
    switch (command.type) {
      case "interact":
        this.interact();
        break;
      case "visit": {
        if (this.seated) this.stand();
        const o = this.objects.find((o) => o.id === command.id);
        if (o) {
          this.pending = o;
          if (this.poseTravel) {
            this.destinationAfterStand = o.approach;
            this.path = [];
          } else this.go(o.approach);
          this.message = `En camino a ${o.name.toLowerCase()}…`;
        }
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
        this.keys.clear();
        break;
    }
  };
  applyPreferences(prefs: Preferences) {
    this.preferences = prefs;
    save("preferences", prefs);
    this.audio.volume(prefs.volume);
    this.app.graphicsDevice.maxPixelRatio =
      prefs.quality === "high" ? Math.min(window.devicePixelRatio, 1.7) : 1;
    this.sun.light!.castShadows = prefs.quality === "high";
    this.sun.light!.shadowResolution = prefs.quality === "high" ? 2048 : 512;
  }
  go(p: Point) {
    if (!walkable(p, obstacles)) {
      this.message = "Elegí un lugar libre sobre el piso.";
      return;
    }
    this.path = pathfind(this.position, p, obstacles);
    if (!this.path.length) {
      this.message = "No encuentro un camino a ese lugar.";
      this.pending = undefined;
      return;
    }
    this.marker.setPosition(p.x, 0.043, p.z);
    this.marker.enabled = true;
  }
  wave() {
    if (this.seated || this.panel) return;
    this.path = [];
    this.pending = undefined;
    this.state = transition(this.state, "wave");
    this.timer = 1.8;
    this.message = "¡Hola! Qué lindo verte por acá.";
  }
  interact() {
    if (this.panel) return;
    if (this.seated) {
      this.stand();
      return;
    }
    const o = nearest(this.position, this.objects);
    if (!o) {
      this.message = "Acercate a un objeto para descubrirlo.";
      return;
    }
    this.pending = o;
    this.go(o.approach);
  }
  stand() {
    if (!this.seated) return;
    this.poseTravel = {
      from: { ...this.position },
      to: { ...this.seated.approach },
      elapsed: 0,
      duration: 0.5,
    };
    this.seated = undefined;
    this.state = transition(this.state, "stand");
    this.timer = 0.5;
    this.message = "Un pequeño paseo viene bien.";
  }
  activate(o: Interactive) {
    this.pending = undefined;
    this.path = [];
    this.marker.enabled = false;
    this.keys.clear();
    if (o.type === "seat") {
      this.seated = o;
      this.poseTravel = {
        from: { ...this.position },
        to: { ...o.seat! },
        elapsed: 0,
        duration: 0.45,
      };
      this.angle = o.angle ?? 0;
      this.avatar.root.setEulerAngles(0, this.angle, 0);
      this.state = transition(this.state, "sit");
      this.message = "Sin apuro. Presioná E para levantarte.";
      return;
    }
    this.state = transition(this.state, "interact");
    this.timer = 0.85;
    switch (o.type) {
      case "lamp":
        o.state = !o.state;
        save("lamp", o.state);
        this.message = o.state
          ? "Una luz cálida para quedarse."
          : "La luz está apagada.";
        break;
      case "monitor":
        o.state = true;
        this.world.screen.render!.meshInstances[0].material =
          this.builder.material("#adcfc0", 0.6);
        this.message = "Un encuentro imaginario, sin conexión.";
        this.openPanel("monitor");
        break;
      case "book":
        this.openPanel("book");
        break;
      case "board":
        this.openPanel("board");
        break;
      case "plant":
        this.waterUntil = this.time + 3;
        this.message = "Menta recibió agua. ¡Gracias por cuidarla!";
        break;
      case "radio":
        void this.toggleSound();
        break;
    }
  }
  async toggleSound() {
    if (this.music) {
      this.audio.stop();
      this.music = false;
    } else this.music = await this.audio.play();
    this.objects.find((o) => o.type === "radio")!.state = this.music;
    this.message = this.music ? "Suena «Domingo lento»." : "La radio descansa.";
    this.report();
  }
  update = (delta: number) => {
    if (this.disposed) return;
    const dt = Math.min(delta, 0.1);
    this.time += dt;
    this.frames++;
    this.fpsTime += delta;
    if (this.fpsTime > 0.5) {
      this.fps = Math.round(this.frames / this.fpsTime);
      this.fpsTime = 0;
      this.frames = 0;
    }
    let speed = 0;
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) this.state = transition(this.state, "done");
    }
    const inputX =
      Number(this.keys.has("d") || this.keys.has("arrowright")) -
      Number(this.keys.has("a") || this.keys.has("arrowleft"));
    const inputZ =
      Number(this.keys.has("s") || this.keys.has("arrowdown")) -
      Number(this.keys.has("w") || this.keys.has("arrowup"));
    if (
      !this.seated &&
      !this.panel &&
      (this.timer <= 0 || this.state === "WALKING")
    ) {
      let dir: Point | undefined;
      if (inputX || inputZ) {
        dir = cameraDirection(inputX, inputZ);
        this.path = [];
        this.pending = undefined;
        this.marker.enabled = false;
      } else if (this.path.length) {
        const next = this.path[0];
        const dist = distance(this.position, next);
        if (dist < 0.09) {
          this.path.shift();
          if (!this.path.length) {
            this.marker.enabled = false;
            if (this.pending) this.activate(this.pending);
          }
        } else
          dir = {
            x: (next.x - this.position.x) / dist,
            z: (next.z - this.position.z) / dist,
          };
      }
      if (dir) {
        speed = this.keys.has("shift") ? 2.65 : 1.85;
        const desired = (Math.atan2(dir.x, dir.z) * 180) / Math.PI;
        const diff = ((desired - this.angle + 540) % 360) - 180;
        this.angle += diff * (1 - Math.exp(-dt * 9));
        this.avatar.root.setEulerAngles(0, this.angle, 0);
        const turning = Math.abs(diff) > 75;
        const increment = turning
          ? 0
          : Math.min(
              speed * dt,
              this.path.length
                ? distance(this.position, this.path[0])
                : Infinity,
            );
        const next = moveKinematic(
          this.position,
          { x: dir.x * increment, z: dir.z * increment },
          obstacles,
        );
        const moved = turning || distance(this.position, next) > 0.00001;
        this.position = next;
        if (moved) {
          this.state = turning ? "TURNING" : transition(this.state, "move");
          this.avatar.root.setPosition(this.position.x, 0, this.position.z);
        } else {
          this.state = "IDLE";
          this.path = [];
          this.pending = undefined;
          this.marker.enabled = false;
        }
      } else if (this.state === "WALKING" || this.state === "TURNING")
        this.state = "IDLE";
    }
    if (this.poseTravel) {
      const travel = this.poseTravel;
      travel.elapsed += dt;
      const t = Math.min(1, travel.elapsed / travel.duration),
        u = t * t * (3 - 2 * t);
      this.position = {
        x: pc.math.lerp(travel.from.x, travel.to.x, u),
        z: pc.math.lerp(travel.from.z, travel.to.z, u),
      };
      this.avatar.root.setPosition(this.position.x, 0, this.position.z);
      if (t === 1) {
        this.poseTravel = undefined;
        if (this.destinationAfterStand) {
          const destination = this.destinationAfterStand;
          this.destinationAfterStand = undefined;
          this.go(destination);
        }
      }
    }
    this.avatar.animate(
      this.state,
      this.time,
      speed,
      this.preferences.reduced,
      dt,
      this.seated?.height ?? 0.84,
    );
    // In the hallway the camera frames whichever room is closer.
    this.room =
      rooms.find((r) => inArea(this.position, r.area)) ??
      rooms.reduce((a, b) =>
        distance(this.position, a.center) < distance(this.position, b.center)
          ? a
          : b,
      );
    const center = this.room.center;
    this.near = this.seated ?? nearest(this.position, this.objects);
    this.highlight.enabled = !!this.near;
    if (this.near) {
      this.highlight.setPosition(
        this.near.approach.x,
        0.045,
        this.near.approach.z,
      );
      const scale = this.preferences.reduced
        ? 0.64
        : 0.64 + Math.sin(this.time * 3) * 0.04;
      this.highlight.setLocalScale(scale, 0.016, scale);
    }
    const target =
      this.preferences.camera === "follow"
        ? new pc.Vec3(
            center.x + (this.position.x - center.x) * 0.65,
            0.7,
            center.z + (this.position.z - center.z) * 0.65,
          )
        : new pc.Vec3(center.x, 0.7, center.z);
    const destination = target.clone().add(new pc.Vec3(13, 12.3, 13));
    this.camera.setPosition(
      this.camera
        .getPosition()
        .clone()
        .lerp(this.camera.getPosition(), destination, 1 - Math.exp(-dt * 2.2)),
    );
    this.camera.lookAt(
      this.camera
        .getPosition()
        .clone()
        .sub(new pc.Vec3(13, 12.3, 13)),
    );
    const aspect =
      this.app.graphicsDevice.width / this.app.graphicsDevice.height;
    const height = Math.max(this.zoom, 12 / aspect) * this.room.scale;
    this.camera.camera!.orthoHeight = pc.math.lerp(
      this.camera.camera!.orthoHeight,
      this.preferences.camera === "follow" ? height * 0.76 : height,
      1 - Math.exp(-dt * 3),
    );
    const lampOn = this.objects.find((o) => o.type === "lamp")!.state;
    this.lampIntensity = pc.math.lerp(
      this.lampIntensity,
      lampOn ? 1.3 : 0,
      1 - Math.exp(-dt * 4),
    );
    this.world.lamp.light!.intensity = this.lampIntensity;
    const bulbMaterial = this.world.lampBulb.render!.meshInstances[0]
      .material as pc.StandardMaterial;
    bulbMaterial.emissiveIntensity = this.lampIntensity / 1.3;
    bulbMaterial.update();
    const watered = this.time < this.waterUntil;
    this.objects.find((o) => o.type === "plant")!.state = watered;
    this.plantGrowth = pc.math.lerp(
      this.plantGrowth,
      watered ? 0.1 : 0,
      1 - Math.exp(-dt * 5),
    );
    this.world.plants[1].setLocalScale(
      1 + this.plantGrowth * 0.3,
      1 + this.plantGrowth,
      1 + this.plantGrowth * 0.3,
    );
    if (!this.preferences.reduced) {
      this.world.plants.forEach((p, i) =>
        p.setLocalEulerAngles(
          Math.sin(this.time * 0.8 + i) * 1.4,
          0,
          Math.cos(this.time * 0.7 + i) * 1.3,
        ),
      );
      this.world.curtains.forEach((p, i) =>
        p.setLocalEulerAngles(Math.sin(this.time * 0.6 + i) * 1.1, 0, 0),
      );
      this.dust.forEach((p, i) =>
        p.setLocalPosition(
          -4.5 + (i % 6) * 0.22 + Math.sin(this.time * 0.2 + i) * 0.1,
          0.5 + Math.floor(i / 6) * 0.5 + Math.sin(this.time * 0.4 + i) * 0.12,
          1.5 + (i % 3) * 0.4,
        ),
      );
    }
    this.world.clock.setLocalEulerAngles(0, 0, -this.time * 0.6);
    this.world.water.forEach((drop, i) => {
      drop.enabled = this.time < this.waterUntil;
      if (drop.enabled) {
        const u = (this.time * 1.2 + i / 12) % 1;
        drop.setLocalPosition(
          0.1 + Math.cos(i * 2.4) * u * 0.3,
          1.9 - u * 1.35,
          -4.7 + Math.sin(i * 2.4) * u * 0.3,
        );
      }
    });
    this.world.radio.setLocalEulerAngles(
      0,
      0,
      this.music && !this.preferences.reduced
        ? Math.sin(this.time * 4) * 1.5
        : 0,
    );
    this.notifyTimer += dt;
    if (this.notifyTimer > 0.1) {
      this.notifyTimer = 0;
      this.report();
    }
  };
  report() {
    const indicator = this.near
      ? this.camera.camera!.worldToScreen(
          new pc.Vec3(
            this.near.position.x,
            this.seated ? 2.55 : 1.65,
            this.near.position.z,
          ),
        )
      : undefined;
    this.emit({
      ready: true,
      position: { ...this.position },
      state: this.state,
      near: this.near?.id,
      nearName: this.near?.name,
      fps: this.fps,
      lamp: this.objects.find((o) => o.type === "lamp")!.state,
      music: this.music,
      target: this.path.at(-1),
      indicator: indicator ? { x: indicator.x, y: indicator.y } : undefined,
      message: this.message,
      room: { name: this.room.name, mood: this.room.mood },
    });
  }
  destroy() {
    this.disposed = true;
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
    window.removeEventListener("blur", this.blur);
    const canvas = this.app.graphicsDevice.canvas;
    canvas.removeEventListener("pointerdown", this.pointer);
    canvas.removeEventListener("wheel", this.wheel);
    this.app.off("update", this.update);
    this.audio.destroy();
    if (this.batchId !== undefined) this.app.batcher.removeGroup(this.batchId);
    this.root.destroy();
    this.builder.destroy();
  }
}
