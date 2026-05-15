import { describe, expect, it } from "vitest";
import { clampToWorkArea, getBottomY, moveToward, snapToBottomLine } from "./movement";

describe("movement", () => {
  const workArea = { x: 0, y: 0, width: 1000, height: 700 };
  const petSize = { width: 240, height: 280 };

  it("computes bottom activity y", () => {
    expect(getBottomY(workArea, petSize, 12)).toBe(408);
  });

  it("clamps position to work area", () => {
    expect(clampToWorkArea({ x: -20, y: -10 }, workArea, petSize)).toEqual({ x: 0, y: 0 });
    expect(clampToWorkArea({ x: 900, y: 600 }, workArea, petSize)).toEqual({ x: 760, y: 420 });
  });

  it("snaps to bottom line while preserving clamped x", () => {
    expect(snapToBottomLine({ x: 900, y: 10 }, workArea, petSize, 12)).toEqual({ x: 760, y: 408 });
  });

  it("moves toward target without overshooting", () => {
    expect(moveToward(0, 10, 3)).toBe(3);
    expect(moveToward(8, 10, 3)).toBe(10);
    expect(moveToward(10, 0, 3)).toBe(7);
  });
});
