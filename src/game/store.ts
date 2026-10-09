import type { AvatarState, PanelType, Point } from "./types";
export interface Preferences {
  camera: "general" | "follow";
  quality: "high" | "low";
  reduced: boolean;
  volume: number;
  fps: boolean;
}
export const defaults: Preferences = {
  camera: "general",
  quality: "high",
  reduced: false,
  volume: 0.25,
  fps: false,
};
/** Observable game state for the HUD, published a few times per second. */
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
export type { PanelType };
type Listener = () => void;
type IndicatorListener = (at?: { x: number; y: number }) => void;
/**
 * The only channel between the game and React: snapshots flow out through
 * `subscribe`/`getSnapshot` (for `useSyncExternalStore`), commands flow in
 * through `send`. A network transport can replace the runtime behind it.
 */
export class GameStore {
  private snapshot: Snapshot;
  private listeners = new Set<Listener>();
  private indicatorListeners = new Set<IndicatorListener>();
  private handler?: (command: Command) => void;
  /** Last projected indicator, for subscribers that mount late. */
  indicator?: { x: number; y: number };
  constructor(initial: Snapshot) {
    this.snapshot = initial;
  }
  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  publish(snapshot: Snapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((l) => l());
  }
  /** Per-frame screen position of the interaction prompt (no React render). */
  onIndicator(listener: IndicatorListener) {
    this.indicatorListeners.add(listener);
    return () => {
      this.indicatorListeners.delete(listener);
    };
  }
  moveIndicator(at?: { x: number; y: number }) {
    this.indicator = at;
    this.indicatorListeners.forEach((l) => l(at));
  }
  attach(handler?: (command: Command) => void) {
    this.handler = handler;
  }
  send(command: Command) {
    this.handler?.(command);
  }
}
