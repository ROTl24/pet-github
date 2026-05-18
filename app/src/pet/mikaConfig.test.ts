import { describe, expect, it } from "vitest";
import { mikaConfig } from "./mikaConfig";

describe("mikaConfig", () => {
  it("describes the current spritesheet grid", () => {
    expect(mikaConfig.frameWidth).toBe(192);
    expect(mikaConfig.frameHeight).toBe(208);
    expect(mikaConfig.columns).toBe(8);
    expect(mikaConfig.rows).toBe(9);
    expect(mikaConfig.displayScale).toBe(0.8);
  });

  it("contains the MVP animation keys", () => {
    expect(Object.keys(mikaConfig.animations).sort()).toEqual([
      "drag",
      "eat",
      "idle",
      "tired",
      "walkLeft",
      "walkRight",
      "wave",
      "work",
    ]);
  });

  it("uses a Vite-managed spritesheet asset URL", () => {
    expect(mikaConfig.spritesheetPath).toContain("spritesheet.webp");
    expect(mikaConfig.spritesheetPath).not.toBe("../../pet/spritesheet.webp");
  });

  it("uses the original standing animation as the default idle row", () => {
    expect(mikaConfig.animations.idle.row).toBe(0);
  });
});
