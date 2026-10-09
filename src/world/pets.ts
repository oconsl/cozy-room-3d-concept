import { palette as c, type Builder } from "./builder";
import { layout } from "./layout";
/** Michi's corner: food and water bowls on a mat, and a cushioned bed. */
export function buildPetCorner(b: Builder) {
  const shape = b.shape.bind(b);
  const bowls = b.group("Pet bowls", layout.petBowls.x, 0, layout.petBowls.z);
  shape("Bowl mat", "round", [0, 0.045, 0], [1.02, 0.03, 0.42], c.sage, bowls);
  // Food bowl with a little mound of kibble.
  b.frustum(
    "Food bowl",
    [-0.25, 0.1, 0],
    [0.26, 0.1, 0.26],
    1.3,
    c.terra,
    bowls,
  );
  shape(
    "Kibble mound",
    "sphere",
    [-0.25, 0.14, 0],
    [0.2, 0.05, 0.2],
    "#9a6a44",
    bowls,
  );
  for (const [x, z] of [
    [-0.29, 0.04],
    [-0.22, -0.05],
    [-0.2, 0.05],
    [-0.31, -0.03],
  ])
    shape(
      "Kibble",
      "sphere",
      [x, 0.165, z],
      [0.04, 0.03, 0.04],
      "#7d5536",
      bowls,
    );
  // Water bowl.
  b.frustum(
    "Water bowl",
    [0.25, 0.1, 0],
    [0.26, 0.1, 0.26],
    1.3,
    c.blue,
    bowls,
  );
  shape(
    "Water",
    "cylinder",
    [0.25, 0.135, 0],
    [0.27, 0.01, 0.27],
    "#cfe6ec",
    bowls,
    [],
    0.15,
  );
  shape(
    "Fish print",
    "sphere",
    [0, 0.062, 0.12],
    [0.14, 0.005, 0.07],
    c.cream,
    bowls,
  );
  // Bed: bolsters on the wall sides keep Michi visible from the camera.
  const bed = b.group("Cat bed", layout.catBed.x, 0, layout.catBed.z);
  shape("Cat bed base", "round", [0, 0.06, 0], [0.85, 0.12, 0.75], c.pink, bed);
  shape(
    "Cat bed cushion",
    "round",
    [0.04, 0.13, 0.04],
    [0.66, 0.08, 0.56],
    c.cream,
    bed,
  );
  shape(
    "Cat bed back",
    "round",
    [0, 0.18, -0.3],
    [0.85, 0.26, 0.16],
    c.pink,
    bed,
  );
  shape(
    "Cat bed side",
    "round",
    [-0.35, 0.16, 0.04],
    [0.16, 0.22, 0.6],
    c.pink,
    bed,
  );
  shape(
    "Cat bed lip",
    "round",
    [0.06, 0.15, 0.32],
    [0.7, 0.1, 0.12],
    "#e6b9b0",
    bed,
  );
}
