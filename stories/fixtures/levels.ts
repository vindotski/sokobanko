import type { LevelJson } from "@sokoban/core";

/**
 * Levels for stories, as the API returns them. The maps are the published
 * ones (scripts/import-collection.ts wrote them into the migrations).
 */
type Level = LevelJson & { collection: string; number: number };

export const firstPush: Level = {
  id: "first-push",
  title: "First Push",
  collection: "basics",
  number: 1,
  map: ["#########", "#@  $  .#", "#########"],
};

export const twoBoxes: Level = {
  id: "two-boxes",
  title: "Two Boxes",
  collection: "basics",
  number: 3,
  map: [" #####", "##   #", "#@$$ #", "#  ..#", "######"],
};

export const bigRoom: Level = {
  id: "big-room",
  title: "Big Room",
  collection: "basics",
  number: 2,
  map: [
    "##############################",
    "#@                           #",
    "#  $                         #",
    ...Array.from({ length: 15 }, () => "#                            #"),
    "#                           .#",
    "##############################",
  ],
};

export const microban1: Level = {
  id: "microban-001",
  title: "Microban 1",
  collection: "microban",
  number: 1,
  map: ["####", "# .#", "#  ###", "#*@  #", "#  $ #", "#  ###", "####"],
};

export const microban7: Level = {
  id: "microban-007",
  title: "Microban 7",
  collection: "microban",
  number: 7,
  map: [
    "#######",
    "#     #",
    "# .$. #",
    "# $.$ #",
    "# .$. #",
    "# $.$ #",
    "#  @  #",
    "#######",
  ],
};

/** A box pushed into a corner, where it can never reach a goal. */
export const deadBox: Level = {
  id: "dead-box",
  title: "Dead Box",
  collection: "basics",
  number: 9,
  map: ["######", "#$   #", "#  @.#", "######"],
};

export const levels = [firstPush, bigRoom, twoBoxes, microban1, microban7];
export const collections = [
  { id: "basics", title: "Basics" },
  { id: "microban", title: "Microban" },
];
