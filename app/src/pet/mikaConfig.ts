import type { PetRuntimeConfig } from "./types";

export const mikaConfig = {
  id: "mika",
  displayName: "Mika",
  spritesheetPath: "../../pet/spritesheet.webp",
  frameWidth: 192,
  frameHeight: 208,
  columns: 8,
  rows: 9,
  animations: {
    idle: { row: 0, frames: 6, durationMs: 1200, loop: true },
    walkRight: { row: 1, frames: 8, durationMs: 900, loop: true },
    walkLeft: { row: 2, frames: 8, durationMs: 900, loop: true },
    wave: { row: 3, frames: 4, durationMs: 800, loop: false },
    drag: { row: 4, frames: 5, durationMs: 700, loop: true },
    eat: { row: 5, frames: 6, durationMs: 1000, loop: false },
    tired: { row: 6, frames: 6, durationMs: 1300, loop: true },
    work: { row: 7, frames: 6, durationMs: 1000, loop: true },
  },
} satisfies PetRuntimeConfig;
