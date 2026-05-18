import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PetApp } from "./PetApp";

const tauriMocks = vi.hoisted(() => ({
  listen: vi.fn(),
  listeners: {} as Record<string, Array<() => void>>,
  setPosition: vi.fn(() => Promise.resolve()),
  loadPersistedPetState: vi.fn(),
  savePersistedPetState: vi.fn(() => Promise.resolve()),
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

vi.mock("./pet/storage", () => ({
  loadPersistedPetState: tauriMocks.loadPersistedPetState,
  savePersistedPetState: tauriMocks.savePersistedPetState,
}));

describe("PetApp", () => {
  beforeEach(() => {
    tauriMocks.listen.mockReset();
    tauriMocks.setPosition.mockClear();
    tauriMocks.loadPersistedPetState.mockReset();
    tauriMocks.savePersistedPetState.mockClear();
    tauriMocks.listeners = {};
    tauriMocks.listen.mockImplementation((event: string, handler: () => void) => {
      tauriMocks.listeners[event] = [...(tauriMocks.listeners[event] ?? []), handler];
      return Promise.resolve(vi.fn());
    });
    tauriMocks.loadPersistedPetState.mockResolvedValue(null);
  });

  it("keeps Mika where the user releases her instead of snapping back to the bottom", async () => {
    Object.defineProperty(window.screen, "availWidth", { configurable: true, value: 1000 });
    Object.defineProperty(window.screen, "availHeight", { configurable: true, value: 800 });
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    tauriMocks.loadPersistedPetState.mockResolvedValueOnce({
      position: { x: 100, y: 100 },
      stats: { mood: 70, energy: 80 },
      scale: 1,
      activityResponseEnabled: true,
      restReminderEnabled: true,
      paused: false,
    });

    const { container } = render(<PetApp />);
    const shell = container.querySelector(".pet-shell");
    if (!shell) throw new Error("pet shell missing");

    await waitFor(() =>
      expect(tauriMocks.setPosition).toHaveBeenLastCalledWith(
        expect.objectContaining({ x: 100, y: 100 }),
      ),
    );
    tauriMocks.setPosition.mockClear();

    fireEvent.pointerDown(shell, { pointerId: 1, screenX: 110, screenY: 120 });
    fireEvent.pointerMove(shell, { pointerId: 1, screenX: 360, screenY: 310 });
    fireEvent.pointerUp(shell, { pointerId: 1, screenX: 360, screenY: 310 });

    await waitFor(() =>
      expect(tauriMocks.setPosition).toHaveBeenLastCalledWith(
        expect.objectContaining({ x: 350, y: 290 }),
      ),
    );
  });

  it("does not switch from idle to work animation on a single activity pulse", async () => {
    render(<PetApp />);

    await waitFor(() => expect(tauriMocks.listeners["activity-pulse"]).toHaveLength(1));
    act(() => tauriMocks.listeners["activity-pulse"][0]());

    expect(screen.getByLabelText("Mika idle")).toBeInTheDocument();
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

  it("hydrates persisted pet state on startup", async () => {
    tauriMocks.loadPersistedPetState.mockResolvedValueOnce({
      position: { x: 123, y: 456 },
      stats: { mood: 44, energy: 55 },
      scale: 1,
      activityResponseEnabled: true,
      restReminderEnabled: true,
      paused: true,
    });

    render(<PetApp />);

    expect(await screen.findByLabelText("Mood 44 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Energy 55 of 100")).toBeInTheDocument();
    await waitFor(() =>
      expect(tauriMocks.setPosition).toHaveBeenLastCalledWith(
        expect.objectContaining({ x: 123, y: 456 }),
      ),
    );
  });

  it("saves pet state after changes", async () => {
    vi.useFakeTimers();
    try {
      render(<PetApp />);

      await act(async () => {
        await Promise.resolve();
      });
      expect(tauriMocks.loadPersistedPetState).toHaveBeenCalledTimes(1);

      act(() => tauriMocks.listeners["tray-feed"][0]());
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(tauriMocks.savePersistedPetState).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: { mood: 78, energy: 83 },
          paused: false,
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves persisted settings fields when saving pet state changes", async () => {
    vi.useFakeTimers();
    tauriMocks.loadPersistedPetState.mockResolvedValueOnce({
      position: { x: 1, y: 2 },
      stats: { mood: 70, energy: 80 },
      scale: 1.5,
      activityResponseEnabled: false,
      restReminderEnabled: false,
      paused: false,
    });

    try {
      render(<PetApp />);

      await act(async () => {
        await Promise.resolve();
      });
      act(() => tauriMocks.listeners["tray-feed"][0]());
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(tauriMocks.savePersistedPetState).toHaveBeenCalledWith(
        expect.objectContaining({
          scale: 1.5,
          activityResponseEnabled: false,
          restReminderEnabled: false,
          stats: { mood: 78, energy: 83 },
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not save before persisted state changes", async () => {
    vi.useFakeTimers();
    const resolver: { current?: (value: null) => void } = {};
    tauriMocks.loadPersistedPetState.mockImplementationOnce(
      () =>
        new Promise<null>((resolve) => {
          resolver.current = resolve;
        }),
    );

    try {
      render(<PetApp />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(tauriMocks.savePersistedPetState).not.toHaveBeenCalled();

      await act(async () => {
        resolver.current?.(null);
        await Promise.resolve();
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(tauriMocks.savePersistedPetState).not.toHaveBeenCalled();

      act(() => tauriMocks.listeners["tray-feed"][0]());
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(tauriMocks.savePersistedPetState).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores invalid persisted fields on startup", async () => {
    tauriMocks.loadPersistedPetState.mockResolvedValueOnce({
      position: { x: Number.NaN, y: 456 },
      stats: { mood: "bad", energy: 55 },
      scale: 1,
      activityResponseEnabled: true,
      restReminderEnabled: true,
      paused: "yes",
    });

    render(<PetApp />);

    expect(await screen.findByLabelText("Mood 70 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Energy 80 of 100")).toBeInTheDocument();
  });
});
