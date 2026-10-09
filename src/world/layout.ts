import type { Area, Obstacle, Point } from "../game/types";
// Walkable floor: centre limits already keep a margin from the walls. The
// hallway overlaps both rooms so the avatar can cross the thresholds.
export const floorAreas: Area[] = [
  { minX: -5.55, maxX: 5.55, minZ: -5.55, maxZ: 5.55 },
  { minX: 5.4, maxX: 10.2, minZ: -1.6, maxZ: -0.4 },
  { minX: 9.95, maxX: 17.25, minZ: -5.55, maxZ: 1.75 },
];
export interface Room {
  name: string;
  mood: string;
  center: Point;
  area: Area;
  /** Orthographic framing relative to the main studio. */
  scale: number;
}
export const rooms: Room[] = [
  {
    name: "ESTUDIO 01",
    mood: "LUZ DE TARDE",
    center: { x: 0, z: 0 },
    area: floorAreas[0],
    scale: 1,
  },
  {
    name: "DORMITORIO 02",
    mood: "HORA AZUL",
    center: { x: 13.6, z: -1.9 },
    area: floorAreas[2],
    scale: 0.82,
  },
];
export interface Placement {
  x: number;
  z: number;
  /** Footprint (width along X, depth along Z) blocking the avatar. */
  footprint?: [number, number];
}
const at = (x: number, z: number, w?: number, d?: number): Placement => ({
  x,
  z,
  footprint: w === undefined ? undefined : [w, d ?? w],
});
/**
 * Single source of truth for furniture that blocks movement or can be used:
 * the world builder places geometry here, colliders and interactions are
 * derived from the same values.
 */
export const layout = {
  // Studio.
  sofa: at(-3.3, -3.5, 3.3, 1.3),
  coffeeTable: at(-3.2, -1.25, 2, 1),
  lamp: at(-1, -4.3, 0.55),
  desk: at(2.8, -4, 3.2, 1.3),
  deskChair: at(2.8, -2.5, 0.9),
  readingChair: at(-4, 2.2, 1.5),
  sideTable: at(-2.5, 2.5, 0.6),
  socialTable: at(2.9, 2.3, 1.8),
  socialChairWest: at(1.5, 2.3, 0.7),
  socialChairEast: at(4.3, 2.3, 0.7),
  whiteboard: at(5.25, 1, 0.2, 1.6),
  // Rotated 90°: its long side runs along Z.
  tallShelf: at(-5, -0.2, 0.6, 1.8),
  lowShelf: at(-4.7, 4.4, 1.4, 0.6),
  plantCorner: at(-5, -4.7, 0.65),
  monstera: at(0.1, -4.7, 0.65),
  plantReading: at(-3.4, 4.85, 0.5),
  plantSocial: at(4.9, 4.5, 0.7),
  // Bedroom.
  bed: at(14.6, -4.55, 2.2, 2.55),
  nightstandWest: at(13.15, -5.45, 0.65, 0.55),
  nightstandEast: at(16.05, -5.45, 0.65, 0.55),
  wardrobe: at(10.1, -4.2, 0.75, 1.75),
  dresser: at(11.6, -5.5, 1.35, 0.6),
  papasan: at(11.3, 0.6, 1.3),
  records: at(10.05, 1.4, 0.6, 1.25),
  easel: at(16.7, 0.9, 0.8),
  pouf: at(16.5, -1.9, 0.8),
  plantBedroom: at(17.05, -5.2, 0.6),
  floorCushion: at(16.6, -0.55, 0.7),
} satisfies Record<string, Placement>;
// Void on both sides of the hallway and the bedroom's left wall, so that
// simplified paths can only cross between rooms through the doorway.
export const structural: Obstacle[] = [
  { x: 7.75, z: -3.9, w: 3.7, d: 4.2 },
  { x: 7.75, z: 2.9, w: 3.7, d: 6.2 },
  { x: 9.6, z: -3.85, w: 0.22, d: 4.1 },
  { x: 9.6, z: 0.95, w: 0.22, d: 2.3 },
];
export const pos = (p: Placement): Point => ({ x: p.x, z: p.z });
