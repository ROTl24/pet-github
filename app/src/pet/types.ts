export type PetAnimationKey =
  | "idle"
  | "walkRight"
  | "walkLeft"
  | "work"
  | "eat"
  | "drag"
  | "tired"
  | "wave";

export type PetAnimation = {
  row: number;
  frames: number;
  durationMs: number;
  loop: boolean;
};

export type PetRuntimeConfig = {
  id: string;
  displayName: string;
  spritesheetPath: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  animations: Record<PetAnimationKey, PetAnimation>;
};

export type PetMode =
  | "idle"
  | "walk"
  | "work"
  | "drag"
  | "eat"
  | "tired"
  | "paused";

export type PetStats = {
  mood: number;
  energy: number;
};
