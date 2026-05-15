import { describe, expect, it } from "vitest";

import { createInitialPetState, petReducer } from "./reducer";

describe("petReducer", () => {
  it("starts with default state", () => {
    expect(createInitialPetState({ x: 10, y: 20 })).toMatchObject({
      position: { x: 10, y: 20 },
      stats: { mood: 70, energy: 80 },
      paused: false,
      dragging: false,
      eating: false,
      active: false,
      direction: "right",
    });
  });

  it("handles drag lifecycle", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    const dragging = petReducer(initial, { type: "drag-start" });
    expect(dragging.dragging).toBe(true);

    const moved = petReducer(dragging, { type: "drag-move", position: { x: 50, y: 60 } });
    expect(moved.position).toEqual({ x: 50, y: 60 });

    const ended = petReducer(moved, { type: "drag-end", position: { x: 70, y: 80 } });
    expect(ended.dragging).toBe(false);
    expect(ended.position).toEqual({ x: 70, y: 80 });
    expect(ended.stats.mood).toBe(72);
  });

  it("handles feeding", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    const fed = petReducer(initial, { type: "feed" });

    expect(fed.eating).toBe(true);
    expect(fed.stats).toEqual({ mood: 78, energy: 83 });
  });

  it("handles activity and rest ticks", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    const active = petReducer(initial, { type: "activity-tick" });
    expect(active.active).toBe(true);
    expect(active.stats).toEqual({ mood: 71, energy: 79 });

    const rested = petReducer(active, { type: "rest-tick" });
    expect(rested.active).toBe(false);
    expect(rested.stats).toEqual({ mood: 71, energy: 80 });
  });

  it("toggles pause", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });

    expect(petReducer(initial, { type: "set-paused", paused: true }).paused).toBe(true);
  });
});
