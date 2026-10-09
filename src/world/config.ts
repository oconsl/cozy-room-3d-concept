import type { Area, Interactive, Obstacle, Point } from "../game/logic";
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
export const obstacles: Obstacle[] = [
  // Void on both sides of the hallway and the bedroom's left wall, so that
  // simplified paths can only cross between rooms through the doorway.
  { x: 7.75, z: -3.9, w: 3.7, d: 4.2 },
  { x: 7.75, z: 2.9, w: 3.7, d: 6.2 },
  { x: 9.6, z: -3.85, w: 0.22, d: 4.1 },
  { x: 9.6, z: 0.95, w: 0.22, d: 2.3 },
  // Bedroom furniture.
  { x: 14.6, z: -4.55, w: 2.2, d: 2.55 },
  { x: 13.15, z: -5.45, w: 0.65, d: 0.55 },
  { x: 16.05, z: -5.45, w: 0.65, d: 0.55 },
  { x: 10.1, z: -4.2, w: 0.75, d: 1.75 },
  { x: 11.6, z: -5.5, w: 1.35, d: 0.6 },
  { x: 11.3, z: 0.6, w: 1.3, d: 1.3 },
  { x: 10.05, z: 1.4, w: 0.6, d: 1.25 },
  { x: 16.7, z: 0.9, w: 0.8, d: 0.8 },
  { x: 16.5, z: -1.9, w: 0.8, d: 0.8 },
  { x: 17.05, z: -5.2, w: 0.6, d: 0.6 },
  { x: 16.6, z: -0.55, w: 0.7, d: 0.7 },
  { x: 5.25, z: 1, w: 0.2, d: 1.6 },
  { x: -5, z: -4.7, w: 0.65, d: 0.65 },
  { x: 0.1, z: -4.7, w: 0.65, d: 0.65 },
  { x: -3.4, z: 4.85, w: 0.5, d: 0.5 },
  { x: 4.9, z: 4.5, w: 0.7, d: 0.7 },
  { x: -1, z: -4.3, w: 0.55, d: 0.55 },
  { x: -3.3, z: -3.5, w: 3.3, d: 1.3 },
  { x: -3.2, z: -1.25, w: 2, d: 1 },
  { x: 2.8, z: -4, w: 3.2, d: 1.3 },
  { x: 2.8, z: -2.5, w: 0.9, d: 0.9 },
  { x: -4, z: 2.2, w: 1.5, d: 1.5 },
  { x: -2.5, z: 2.5, w: 0.6, d: 0.6 },
  { x: 2.9, z: 2.3, w: 1.8, d: 1.8 },
  { x: 1.5, z: 2.3, w: 0.7, d: 0.7 },
  { x: 4.3, z: 2.3, w: 0.7, d: 0.7 },
  { x: -5, z: -0.2, w: 0.6, d: 1.8 },
  { x: -4.7, z: 4.4, w: 1.4, d: 0.6 },
];
export const interactions: Interactive[] = [
  {
    id: "sofa",
    name: "Sofá de lino",
    type: "seat",
    position: { x: -3.3, z: -3.5 },
    approach: { x: -3.3, z: -2.5 },
    seat: { x: -3.3, z: -3.35 },
    angle: 0,
    radius: 1.5,
    state: false,
  },
  {
    id: "lamp",
    name: "Luz de la tarde",
    type: "lamp",
    position: { x: -1, z: -4.3 },
    approach: { x: -1, z: -3.4 },
    radius: 1.6,
    state: true,
  },
  {
    id: "monitor",
    name: "Un café con amigos",
    type: "monitor",
    position: { x: 2.8, z: -4 },
    approach: { x: 1.3, z: -2.6 },
    radius: 1.5,
    state: false,
  },
  {
    id: "chair",
    name: "Silla del escritorio",
    type: "seat",
    position: { x: 2.8, z: -2.5 },
    approach: { x: 2.8, z: -1.5 },
    seat: { x: 2.8, z: -2.5 },
    angle: 180,
    height: 0.76,
    radius: 1.3,
    state: false,
  },
  {
    id: "book",
    name: "Pequeños mundos",
    type: "book",
    position: { x: -5, z: -0.2 },
    approach: { x: -4, z: -0.2 },
    radius: 1.4,
    state: false,
  },
  {
    id: "board",
    name: "Ideas compartidas",
    type: "board",
    position: { x: 5.25, z: 1 },
    approach: { x: 4.5, z: 1 },
    radius: 1.4,
    state: false,
  },
  {
    id: "plant",
    name: "Monstera · Menta",
    type: "plant",
    position: { x: 0.1, z: -4.7 },
    approach: { x: 0.1, z: -3.7 },
    radius: 1.5,
    state: false,
  },
  {
    id: "radio",
    name: "Radio de domingo",
    type: "radio",
    position: { x: -2.5, z: 2.5 },
    approach: { x: -2, z: 1.5 },
    radius: 1.5,
    state: false,
  },
  {
    id: "bed",
    name: "Cama de nubes",
    type: "seat",
    position: { x: 14.6, z: -4.55 },
    approach: { x: 14.6, z: -2.75 },
    seat: { x: 14.6, z: -3.55 },
    angle: 0,
    height: 0.8,
    radius: 1.5,
    state: false,
  },
  {
    id: "papasan",
    name: "Sillón papasan",
    type: "seat",
    position: { x: 11.3, z: 0.6 },
    approach: { x: 12.3, z: 0.03 },
    seat: { x: 11.3, z: 0.6 },
    angle: 120,
    height: 0.78,
    radius: 1.4,
    state: false,
  },
];
