import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsPanel } from "./SettingsPanel";

describe("SettingsPanel", () => {
  it("renders pause control and close action", () => {
    const onPausedChange = vi.fn();
    const onClose = vi.fn();

    render(<SettingsPanel paused={false} onPausedChange={onPausedChange} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Pause Mika"));
    expect(onPausedChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
