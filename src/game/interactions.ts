import type * as pc from "playcanvas";
import { palette, type Builder, type WorldRefs } from "../world/build";
import type { AmbientSystem } from "./ambient";
import type { AvatarController } from "./avatarController";
import type { Cat } from "./cat";
import { nearest, save } from "./logic";
import type { Interactive, InteractiveType, PanelType, Point } from "./types";
/** What an interaction may do to the rest of the game. */
export interface InteractionContext {
  avatar: AvatarController;
  ambient: AmbientSystem;
  cat: Cat;
  builder: Builder;
  world: WorldRefs;
  say: (message: string) => void;
  openPanel: (panel: PanelType) => void;
  toggleSound: () => void;
}
type Handler = (o: Interactive, ctx: InteractionContext) => void;
/**
 * One strategy per object type. Adding a new kind of object means adding an
 * entry here, without touching the runtime.
 */
const handlers: Record<InteractiveType, Handler> = {
  seat: (o, { avatar, say }) => {
    avatar.sit(o);
    say("Sin apuro. Presioná E para levantarte.");
  },
  lamp: (o, { ambient, say }) => {
    o.state = !o.state;
    ambient.lampOn = o.state;
    save("lamp", o.state);
    say(o.state ? "Una luz cálida para quedarse." : "La luz está apagada.");
  },
  monitor: (o, { builder, world, say, openPanel }) => {
    o.state = true;
    // Swap to another cached material; shared materials are never mutated.
    world.screen.render!.meshInstances[0].material = builder.material(
      "#adcfc0",
      0.6,
    );
    say("Un encuentro imaginario, sin conexión.");
    openPanel("monitor");
  },
  book: (_o, { openPanel }) => openPanel("book"),
  board: (_o, { openPanel }) => openPanel("board"),
  plant: (_o, { ambient, say }) => {
    ambient.startWatering();
    say("Menta recibió agua. ¡Gracias por cuidarla!");
  },
  radio: (_o, { toggleSound }) => toggleSound(),
  cat: (_o, { cat, avatar, say }) => say(cat.call(avatar.position)),
};
/** Proximity, highlight and dispatch of interactive objects. */
export class InteractionSystem {
  readonly objects: Interactive[];
  near?: Interactive;
  private highlight: pc.Entity;
  private byType = new Map<InteractiveType, Interactive>();
  constructor(
    b: Builder,
    source: Interactive[],
    private ctx: InteractionContext,
  ) {
    this.objects = source.map((o) => ({ ...o }));
    for (const o of this.objects)
      if (!this.byType.has(o.type)) this.byType.set(o.type, o);
    this.highlight = b.dynamic(
      b.shape(
        "Interaction halo",
        "cylinder",
        [0, 0.045, 0],
        [0.7, 0.015, 0.7],
        palette.gold,
      ),
    );
    this.highlight.enabled = false;
  }
  find(id: string) {
    return this.objects.find((o) => o.id === id);
  }
  /** First object of a type, resolved once. */
  ofType(type: InteractiveType) {
    return this.byType.get(type);
  }
  activate(o: Interactive) {
    const { avatar } = this.ctx;
    avatar.clearPath();
    if (o.type !== "seat") avatar.interact();
    handlers[o.type](o, this.ctx);
  }
  update(position: Point, time: number, reduced: boolean) {
    this.near = this.ctx.avatar.seated ?? nearest(position, this.objects);
    this.highlight.enabled = !!this.near;
    if (!this.near) return;
    this.highlight.setPosition(
      this.near.approach.x,
      0.045,
      this.near.approach.z,
    );
    const scale = reduced ? 0.64 : 0.64 + Math.sin(time * 3) * 0.04;
    this.highlight.setLocalScale(scale, 0.016, scale);
  }
}
