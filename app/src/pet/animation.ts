import type { PetAnimationKey, PetMode } from "./types";

export type Direction = "left" | "right";

export type ModeInputs = {
  paused: boolean;
  dragging: boolean;
  eating: boolean;
  lowEnergy: boolean;
  active: boolean;
  walking: boolean;
};

export function chooseMode(input: ModeInputs): PetMode {
  if (input.paused) return "paused";
  if (input.dragging) return "drag";
  if (input.eating) return "eat";
  if (input.lowEnergy) return "tired";
  if (input.active) return "work";
  if (input.walking) return "walk";
  return "idle";
}

export function getAnimationKey(mode: PetMode, direction: Direction): PetAnimationKey {
  if (mode === "walk") return direction === "left" ? "walkLeft" : "walkRight";
  if (mode === "paused") return "idle";
  return mode;
}
