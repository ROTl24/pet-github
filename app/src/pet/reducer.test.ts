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
      bubble: null,
    });
  });

  it("does not share mutable initial objects", () => {
    const position = { x: 10, y: 20 };
    const first = createInitialPetState(position);
    const second = createInitialPetState({ x: 30, y: 40 });

    expect(first.position).not.toBe(position);
    expect(first.stats).not.toBe(second.stats);

    position.x = 99;
    expect(first.position).toEqual({ x: 10, y: 20 });
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
    expect(petReducer(initial, { type: "toggle-paused" }).paused).toBe(true);
    expect(
      petReducer(petReducer(initial, { type: "toggle-paused" }), { type: "toggle-paused" }).paused,
    ).toBe(false);
  });

  it("hydrates persisted state", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    const hydrated = petReducer(initial, {
      type: "hydrate",
      state: {
        position: { x: 12, y: 34 },
        stats: { mood: 55, energy: 66 },
        paused: true,
      },
    });

    expect(hydrated.position).toEqual({ x: 12, y: 34 });
    expect(hydrated.stats).toEqual({ mood: 55, energy: 66 });
    expect(hydrated.paused).toBe(true);
  });
});
