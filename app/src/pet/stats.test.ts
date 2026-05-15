import { describe, expect, it } from "vitest";
import {
  applyActivityTick,
  applyDragAttention,
  applyFeed,
  applyRestTick,
  clampStat,
  defaultStats,
  isLowEnergy,
} from "./stats";

describe("stats", () => {
  it("clamps values to 0..100", () => {
    expect(clampStat(-1)).toBe(0);
    expect(clampStat(101)).toBe(100);
    expect(clampStat(42)).toBe(42);
  });

  it("starts Mika cheerful and energized", () => {
    expect(defaultStats).toEqual({ mood: 70, energy: 80 });
  });

  it("feeding increases mood and energy within bounds", () => {
    expect(applyFeed({ mood: 96, energy: 99 })).toEqual({ mood: 100, energy: 100 });
    expect(applyFeed({ mood: 40, energy: 50 })).toEqual({ mood: 48, energy: 53 });
  });

  it("drag attention increases mood only", () => {
    expect(applyDragAttention({ mood: 40, energy: 50 })).toEqual({ mood: 42, energy: 50 });
  });

  it("activity drains energy slowly and can nudge mood", () => {
    expect(applyActivityTick({ mood: 40, energy: 50 })).toEqual({ mood: 41, energy: 49 });
  });

  it("rest restores energy slowly", () => {
    expect(applyRestTick({ mood: 40, energy: 50 })).toEqual({ mood: 40, energy: 51 });
  });

  it("detects low energy", () => {
    expect(isLowEnergy({ mood: 80, energy: 24 })).toBe(true);
    expect(isLowEnergy({ mood: 80, energy: 25 })).toBe(false);
  });
});
