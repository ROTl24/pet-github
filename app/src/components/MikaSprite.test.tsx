import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mikaConfig } from "../pet/mikaConfig";
import { MikaSprite } from "./MikaSprite";

describe("MikaSprite", () => {
  it("passes configured frame width to animation styles", () => {
    render(<MikaSprite config={mikaConfig} animationKey="idle" paused={false} />);

    expect(screen.getByLabelText("Mika idle")).toHaveStyle({
      "--sprite-frame-width": `${mikaConfig.frameWidth}px`,
    });
  });
});
