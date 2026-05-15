import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PetApp } from "./PetApp";

const tauriMocks = vi.hoisted(() => ({
  listen: vi.fn(),
  setPosition: vi.fn(() => Promise.resolve()),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: tauriMocks.listen,
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setPosition: tauriMocks.setPosition,
  }),
  LogicalPosition: class LogicalPosition {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  },
}));

describe("PetApp", () => {
  it("cleans up activity listener if unmounted before listen resolves", async () => {
    const unlisten = vi.fn();
    const resolver: { current?: (value: () => void) => void } = {};

    tauriMocks.listen.mockImplementationOnce(
      () =>
        new Promise<() => void>((resolve) => {
          resolver.current = resolve;
        }),
    );

    const { unmount } = render(<PetApp />);
    unmount();
    resolver.current?.(unlisten);

    await waitFor(() => expect(unlisten).toHaveBeenCalledTimes(1));
  });
});
