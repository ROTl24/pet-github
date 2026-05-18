import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mikaConfig } from "../pet/mikaConfig";
import { MikaSprite } from "./MikaSprite";

describe("MikaSprite", () => {
  it("renders Mika at the configured display scale", () => {
    render(<MikaSprite config={mikaConfig} animationKey="idle" paused={false} />);

    expect(screen.getByLabelText("Mika idle")).toHaveStyle({
      width: "153.6px",
      height: "166.4px",
      "--sprite-frame-width": "153.6px",
    });
  });
});
