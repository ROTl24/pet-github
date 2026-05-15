import type { PetStats } from "./types";

export const defaultStats: PetStats = { mood: 70, energy: 80 };

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyFeed(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood + 8),
    energy: clampStat(stats.energy + 3),
  };
}

export function applyDragAttention(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood + 2),
    energy: clampStat(stats.energy),
  };
}

export function applyActivityTick(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood + 1),
    energy: clampStat(stats.energy - 1),
  };
}

export function applyRestTick(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood),
    energy: clampStat(stats.energy + 1),
  };
}

export function isLowEnergy(stats: PetStats): boolean {
  return stats.energy < 25;
}
