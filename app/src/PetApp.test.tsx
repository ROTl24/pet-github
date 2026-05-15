import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PetApp } from "./PetApp";

const tauriMocks = vi.hoisted(() => ({
  listen: vi.fn(),
  listeners: {} as Record<string, Array<() => void>>,
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
  beforeEach(() => {
    tauriMocks.listen.mockReset();
    tauriMocks.setPosition.mockClear();
    tauriMocks.listeners = {};
    tauriMocks.listen.mockImplementation((event: string, handler: () => void) => {
      tauriMocks.listeners[event] = [...(tauriMocks.listeners[event] ?? []), handler];
      return Promise.resolve(vi.fn());
    });
  });

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

  it("feeds Mika from tray event", async () => {
    render(<PetApp />);

    await waitFor(() => expect(tauriMocks.listeners["tray-feed"]).toHaveLength(1));
    act(() => tauriMocks.listeners["tray-feed"][0]());

    expect(screen.getByText("Dessert received.")).toBeInTheDocument();
  });

  it("opens settings and toggles pause from tray events", async () => {
    render(<PetApp />);

    await waitFor(() => expect(tauriMocks.listeners["tray-settings"]).toHaveLength(1));
    act(() => tauriMocks.listeners["tray-settings"][0]());
    expect(screen.getByLabelText("Mika settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Pause Mika")).not.toBeChecked();

    act(() => tauriMocks.listeners["tray-pause-toggle"][0]());
    expect(screen.getByLabelText("Pause Mika")).toBeChecked();
  });

  it("toggles pause for every tray pause event", async () => {
    render(<PetApp />);

    await waitFor(() => expect(tauriMocks.listeners["tray-settings"]).toHaveLength(1));
    act(() => tauriMocks.listeners["tray-settings"][0]());

    act(() => {
      tauriMocks.listeners["tray-pause-toggle"][0]();
      tauriMocks.listeners["tray-pause-toggle"][0]();
    });

    expect(screen.getByLabelText("Pause Mika")).not.toBeChecked();
  });

  it("does not start dragging from settings controls", async () => {
    render(<PetApp />);

    await waitFor(() => expect(tauriMocks.listeners["tray-settings"]).toHaveLength(1));
    act(() => tauriMocks.listeners["tray-settings"][0]());
    tauriMocks.setPosition.mockClear();

    fireEvent.pointerDown(screen.getByLabelText("Pause Mika"), {
      pointerId: 1,
      screenX: 12,
      screenY: 34,
    });
    fireEvent.pointerMove(screen.getByLabelText("Pause Mika"), {
      pointerId: 1,
      screenX: 56,
      screenY: 78,
    });

    expect(tauriMocks.setPosition).not.toHaveBeenCalled();
  });
});
