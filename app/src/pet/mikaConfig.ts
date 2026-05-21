import type { PetRuntimeConfig } from "./types";

const spritesheetPath = new URL("../../../pet/spritesheet-24fps.webp", import.meta.url).href;

export const mikaConfig = {
  id: "mika",
  displayName: "Mika",
  spritesheetPath,
  frameWidth: 192,
  frameHeight: 208,
  displayScale: 0.8,
  columns: 24,
  rows: 9,
  animations: {
    idle: { row: 0, frames: 24, durationMs: 1500, loop: true },
    walkRight: { row: 1, frames: 24, durationMs: 1000, loop: true },
    walkLeft: { row: 2, frames: 24, durationMs: 1000, loop: true },
    wave: { row: 3, frames: 24, durationMs: 1000, loop: false },
    drag: { row: 4, frames: 24, durationMs: 900, loop: true },
    eat: { row: 5, frames: 24, durationMs: 1200, loop: false },
    tired: { row: 6, frames: 24, durationMs: 1500, loop: true },
    work: { row: 7, frames: 24, durationMs: 1200, loop: true },
  },
} satisfies PetRuntimeConfig;
