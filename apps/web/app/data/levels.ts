import type { LevelJson } from "@sokobanko/core";

// Placeholder set until levels get a package of their own.
export const LEVELS: LevelJson[] = [
  {
    id: "intro-001",
    title: "First Push",
    map: ["#######", "#@ $ .#", "#######"],
  },
  {
    id: "intro-002",
    title: "Two Boxes",
    map: [" #####", "##   #", "#@$$ #", "#  ..#", "######"],
  },
  {
    // From DoctorLai/sokoban-web (MIT).
    id: "world1-001",
    title: "Hello World!",
    map: ["##########", "####....##", "#  $$$$###", "#  @   ###", "##########"],
  },
];

export function findLevel(id: string): LevelJson | undefined {
  return LEVELS.find((level) => level.id === id);
}
