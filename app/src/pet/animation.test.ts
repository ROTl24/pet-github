import { describe, expect, it } from "vitest";
import { chooseMode, getAnimationKey } from "./animation";

describe("animation", () => {
  it("applies mode priority", () => {
    expect(chooseMode({ paused: true, dragging: true, eating: true, lowEnergy: true, active: true, walking: true })).toBe("paused");
    expect(chooseMode({ paused: false, dragging: true, eating: true, lowEnergy: true, active: true, walking: true })).toBe("drag");
    expect(chooseMode({ paused: false, dragging: false, eating: true, lowEnergy: true, active: true, walking: true })).toBe("eat");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: true, active: true, walking: true })).toBe("tired");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: false, active: true, walking: true })).toBe("work");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: false, active: false, walking: true })).toBe("walk");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: false, active: false, walking: false })).toBe("idle");
  });

  it("maps walk direction to a spritesheet animation", () => {
    expect(getAnimationKey("walk", "left")).toBe("walkLeft");
    expect(getAnimationKey("walk", "right")).toBe("walkRight");
  });

  it("maps non-walk modes directly", () => {
    expect(getAnimationKey("idle", "right")).toBe("idle");
    expect(getAnimationKey("work", "left")).toBe("work");
    expect(getAnimationKey("eat", "right")).toBe("eat");
    expect(getAnimationKey("drag", "left")).toBe("drag");
    expect(getAnimationKey("tired", "right")).toBe("tired");
    expect(getAnimationKey("paused", "left")).toBe("idle");
  });
});
