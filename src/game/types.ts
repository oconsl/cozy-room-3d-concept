export type Point = { x: number; z: number };
export type AvatarState =
  | "IDLE"
  | "WALKING"
  | "TURNING"
  | "SITTING"
  | "STANDING"
  | "WAVING"
  | "INTERACTING";
export interface Area {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
export interface Obstacle {
  x: number;
  z: number;
  w: number;
  d: number;
}
export type InteractiveType =
  "seat" | "lamp" | "monitor" | "book" | "board" | "plant" | "radio";
export interface Interactive {
  id: string;
  name: string;
  type: InteractiveType;
  position: Point;
  approach: Point;
  radius: number;
  state: boolean;
  seat?: Point;
  angle?: number;
  /** Hip height while seated. */
  height?: number;
}
export type PanelType = "board" | "book" | "monitor" | "help" | "settings";
/** Collision radius of the avatar, shared by A*, smoothing and movement. */
export const AVATAR_RADIUS = 0.24;
