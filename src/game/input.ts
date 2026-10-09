import { cameraDirection } from "./logic";
import type { Point } from "./types";
// Physical key positions (`code`), so WASD also works on AZERTY and others.
const MOVEMENT = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);
export interface InputHandlers {
  interact: () => void;
  wave: () => void;
  /** Primary click on the canvas, in CSS pixels relative to it. */
  click: (x: number, y: number) => void;
  zoom: (delta: number) => void;
}
/** Keyboard, pointer and wheel listeners translated into game intents. */
export class InputController {
  /** False while a panel is open: game input is suspended. */
  enabled = true;
  private keys = new Set<string>();
  constructor(
    private canvas: HTMLCanvasElement,
    private handlers: InputHandlers,
  ) {
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
    window.addEventListener("blur", this.clear);
    canvas.addEventListener("pointerdown", this.pointer);
    canvas.addEventListener("wheel", this.wheel, { passive: false });
  }
  private held(...codes: string[]) {
    return codes.some((c) => this.keys.has(c));
  }
  /** Normalised movement in world space, or undefined at rest. */
  direction(): Point | undefined {
    const x =
      Number(this.held("KeyD", "ArrowRight")) -
      Number(this.held("KeyA", "ArrowLeft"));
    const z =
      Number(this.held("KeyS", "ArrowDown")) -
      Number(this.held("KeyW", "ArrowUp"));
    return x || z ? cameraDirection(x, z) : undefined;
  }
  get sprint() {
    return this.held("ShiftLeft", "ShiftRight");
  }
  clear = () => this.keys.clear();
  private editable() {
    const element = document.activeElement;
    return (
      element instanceof HTMLElement &&
      !!element.closest('input,textarea,select,[contenteditable="true"]')
    );
  }
  private keydown = (e: KeyboardEvent) => {
    if (!this.enabled || this.editable()) return;
    if (MOVEMENT.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.repeat) return;
    if (e.code === "KeyE") this.handlers.interact();
    if (e.code === "KeyQ") this.handlers.wave();
  };
  private keyup = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private pointer = (e: PointerEvent) => {
    if (e.button !== 0 || !this.enabled) return;
    const rect = this.canvas.getBoundingClientRect();
    this.handlers.click(e.clientX - rect.left, e.clientY - rect.top);
  };
  private wheel = (e: WheelEvent) => {
    e.preventDefault();
    this.handlers.zoom(e.deltaY);
  };
  destroy() {
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
    window.removeEventListener("blur", this.clear);
    this.canvas.removeEventListener("pointerdown", this.pointer);
    this.canvas.removeEventListener("wheel", this.wheel);
  }
}
