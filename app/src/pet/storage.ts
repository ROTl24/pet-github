import { LazyStore } from "@tauri-apps/plugin-store";

import type { Point } from "./movement";
import type { PetStats } from "./types";

export type PersistedPetState = {
  stats: PetStats;
  position: Point;
  scale: number;
  activityResponseEnabled: boolean;
  restReminderEnabled: boolean;
  paused: boolean;
};

const store = new LazyStore("mika-pet-state.json");

export async function loadPersistedPetState(): Promise<PersistedPetState | null> {
  const value = await store.get<PersistedPetState>("petState");
  return value ?? null;
}

export async function savePersistedPetState(value: PersistedPetState): Promise<void> {
  await store.set("petState", value);
  await store.save();
}
