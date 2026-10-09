import type * as pc from "playcanvas";
import type { Builder } from "./builder";
import { createProps } from "./props";
import { buildStudio } from "./studio";
import { buildHallway } from "./hallway";
import { buildBedroom } from "./bedroom";
import { buildPetCorner } from "./pets";
export { Builder, palette } from "./builder";
export interface WorldRefs {
  lamp: pc.Entity;
  bulbMaterial: pc.StandardMaterial;
  screen: pc.Entity;
  plants: pc.Entity[];
  monstera: pc.Entity;
  curtains: pc.Entity[];
  clock: pc.Entity;
  radio: pc.Entity;
}
export function buildWorld(b: Builder): WorldRefs {
  const props = createProps(b);
  const studio = buildStudio(b, props);
  buildHallway(b, props);
  buildBedroom(b, props);
  buildPetCorner(b);
  return { ...studio, plants: props.plants };
}
