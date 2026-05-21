import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import { Bubble } from "./components/Bubble";
import { Dessert } from "./components/Dessert";
import { MikaSprite } from "./components/MikaSprite";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatusBars } from "./components/StatusBars";
import { chooseMode, getAnimationKey } from "./pet/animation";
import {
  expireActivity,
  recordActivityPulse,
  shouldEnterWorkMode,
  shouldShowRestReminder,
  type ActivitySession,
} from "./pet/activity";
import { mikaConfig } from "./pet/mikaConfig";
import {
  clampToWorkArea,
  moveToward,
  snapToBottomLine,
  type Point,
  type WorkArea,
} from "./pet/movement";
import { createInitialPetState, petReducer } from "./pet/reducer";
import { isLowEnergy } from "./pet/stats";
import {
  loadPersistedPetState,
  savePersistedPetState,
  type PersistedPetState,
} from "./pet/storage";

const petSize = { width: 200, height: 250 };
const bottomMargin = 10;
const walkSpeedPxPerSecond = 70;
const minWalkDistance = 90;
const minWalkPauseMs = 2800;
const maxWalkPauseMs = 6500;
const manualPlacementPauseMs = 5000;

const defaultPersistedSettings = {
  scale: 1,
  activityResponseEnabled: true,
  restReminderEnabled: true,
};

function getPointerPosition(event: PointerEvent, offset: Point): Point {
  return {
    x: event.screenX - offset.x,
    y: event.screenY - offset.y,
  };
}

function getWorkArea(): WorkArea {
  return {
    x: 0,
    y: 0,
    width: window.screen.availWidth,
    height: window.screen.availHeight,
  };
}

function listenWithDeferredCleanup(event: string, handler: () => void): () => void {
  let disposed = false;
  let cleanup: (() => void) | null = null;

  void listen(event, handler).then((unlisten) => {
    if (disposed) {
      unlisten();
      return;
    }
    cleanup = unlisten;
  });

  return () => {
    disposed = true;
    cleanup?.();
  };
}

function chooseWalkTarget(current: Point, workArea: WorkArea): Point {
  const maxX = workArea.x + workArea.width - petSize.width;
  const minX = workArea.x;
  const leftRoom = Math.max(0, current.x - minX);
  const rightRoom = Math.max(0, maxX - current.x);
  const direction = rightRoom >= leftRoom ? 1 : -1;
  const room = direction > 0 ? rightRoom : leftRoom;
  const distance = Math.max(minWalkDistance, room * (0.35 + Math.random() * 0.35));

  return clampToWorkArea(
    {
      x: current.x + direction * Math.min(room, distance),
      y: current.y,
    },
    workArea,
    petSize,
  );
}

function getWalkPauseMs(): number {
  return minWalkPauseMs + Math.random() * (maxWalkPauseMs - minWalkPauseMs);
}

export function PetApp() {
  const startPosition = useMemo(
    () =>
      snapToBottomLine(
        { x: getWorkArea().width - petSize.width - 80, y: 0 },
        getWorkArea(),
        petSize,
        bottomMargin,
      ),
    [],
  );
  const [state, dispatch] = useReducer(petReducer, startPosition, createInitialPetState);
  const [, setActivitySession] = useState<ActivitySession>({
    active: false,
    activeStartedAt: null,
    lastPulseAt: null,
    lastReminderAt: null,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const dragOffset = useRef<Point | null>(null);
  const stateRef = useRef(state);
  const walkTarget = useRef<Point | null>(null);
  const walkPauseUntil = useRef(0);
  const lastSavedSnapshot = useRef<string | null>(null);
  const persistedBase = useRef<
    Pick<PersistedPetState, "scale" | "activityResponseEnabled" | "restReminderEnabled">
  >(defaultPersistedSettings);

  const mode = chooseMode({
    paused: state.paused,
    dragging: state.dragging,
    eating: state.eating,
    lowEnergy: isLowEnergy(state.stats),
    active: state.active,
    walking: state.walking,
  });
  const animationKey = getAnimationKey(mode, state.direction);

  const handleFeed = useCallback(() => {
    dispatch({ type: "feed" });
    window.setTimeout(() => dispatch({ type: "eat-complete" }), 1200);
    window.setTimeout(() => dispatch({ type: "set-bubble", bubble: null }), 2800);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    void getCurrentWindow().setPosition(new LogicalPosition(state.position.x, state.position.y));
  }, [state.position.x, state.position.y]);

  useEffect(() => {
    let animationFrame = 0;
    let lastFrameAt = performance.now();
    walkPauseUntil.current = lastFrameAt + getWalkPauseMs();

    const tick = (now: number) => {
      const currentState = stateRef.current;
      const shouldWalk =
        !currentState.paused &&
        !currentState.dragging &&
        !currentState.eating &&
        !currentState.active &&
        !isLowEnergy(currentState.stats);

      if (!shouldWalk) {
        walkTarget.current = null;
        if (currentState.walking) dispatch({ type: "walk-stop" });
        lastFrameAt = now;
        animationFrame = window.requestAnimationFrame(tick);
        return;
      }

      if (now < walkPauseUntil.current) {
        if (currentState.walking) dispatch({ type: "walk-stop" });
        lastFrameAt = now;
        animationFrame = window.requestAnimationFrame(tick);
        return;
      }

      if (!walkTarget.current) {
        walkTarget.current = chooseWalkTarget(currentState.position, getWorkArea());
        const direction = walkTarget.current.x < currentState.position.x ? "left" : "right";
        dispatch({ type: "walk-start", direction });
      }

      const elapsedSeconds = Math.min((now - lastFrameAt) / 1000, 0.08);
      lastFrameAt = now;
      const target = walkTarget.current;
      const direction = target.x < currentState.position.x ? "left" : "right";
      const nextPosition = clampToWorkArea(
        {
          x: moveToward(
            currentState.position.x,
            target.x,
            walkSpeedPxPerSecond * elapsedSeconds,
          ),
          y: currentState.position.y,
        },
        getWorkArea(),
        petSize,
      );

      dispatch({ type: "walk-step", position: nextPosition, direction });

      if (nextPosition.x === target.x) {
        walkTarget.current = null;
        walkPauseUntil.current = now + getWalkPauseMs();
        dispatch({ type: "walk-stop" });
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    void loadPersistedPetState().then((persisted) => {
      if (persisted) {
        persistedBase.current = {
          scale:
            typeof persisted.scale === "number" && Number.isFinite(persisted.scale)
              ? persisted.scale
              : defaultPersistedSettings.scale,
          activityResponseEnabled:
            typeof persisted.activityResponseEnabled === "boolean"
              ? persisted.activityResponseEnabled
              : defaultPersistedSettings.activityResponseEnabled,
          restReminderEnabled:
            typeof persisted.restReminderEnabled === "boolean"
              ? persisted.restReminderEnabled
              : defaultPersistedSettings.restReminderEnabled,
        };
        dispatch({
          type: "hydrate",
          state: {
            position: persisted.position,
            stats: persisted.stats,
            paused: persisted.paused,
          },
        });
      }
      setPersistenceReady(true);
    });
  }, []);

  useEffect(() => {
    if (!persistenceReady) return;

    const snapshot = JSON.stringify({
      stats: state.stats,
      position: state.position,
      paused: state.paused,
    });
    if (lastSavedSnapshot.current === null) {
      lastSavedSnapshot.current = snapshot;
      return;
    }
    if (lastSavedSnapshot.current === snapshot) return;

    const saveTimer = window.setTimeout(() => {
      void savePersistedPetState({
        stats: state.stats,
        position: state.position,
        scale: persistedBase.current.scale,
        activityResponseEnabled: persistedBase.current.activityResponseEnabled,
        restReminderEnabled: persistedBase.current.restReminderEnabled,
        paused: state.paused,
      });
      lastSavedSnapshot.current = snapshot;
    }, 500);

    return () => window.clearTimeout(saveTimer);
  }, [persistenceReady, state.position, state.stats, state.paused]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setActivitySession((session) => {
        const next = expireActivity(session, now);
        if (next.active !== session.active) {
          dispatch({ type: next.active ? "activity-tick" : "rest-tick" });
        }
        if (shouldShowRestReminder(next, now)) {
          dispatch({ type: "set-bubble", bubble: "要不要休息一下？" });
          return { ...next, lastReminderAt: now };
        }
        return next;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return listenWithDeferredCleanup("activity-pulse", () => {
      const now = Date.now();
      setActivitySession((session) => {
        const next = recordActivityPulse(session, now);
        if (shouldEnterWorkMode(next, now)) {
          dispatch({ type: "activity-tick" });
        }
        return next;
      });
    });
  }, []);

  useEffect(() => {
    const cleanups = [
      listenWithDeferredCleanup("tray-feed", handleFeed),
      listenWithDeferredCleanup("tray-pause-toggle", () => {
        dispatch({ type: "toggle-paused" });
      }),
      listenWithDeferredCleanup("tray-settings", () => {
        setSettingsOpen(true);
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [handleFeed]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button,input,label")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    walkPauseUntil.current = performance.now() + manualPlacementPauseMs;
    walkTarget.current = null;
    dragOffset.current = {
      x: event.screenX - state.position.x,
      y: event.screenY - state.position.y,
    };
    dispatch({ type: "drag-start" });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragOffset.current) return;

    dispatch({
      type: "drag-move",
      position: clampToWorkArea(getPointerPosition(event, dragOffset.current), getWorkArea(), petSize),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragOffset.current) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    const release = getPointerPosition(event, dragOffset.current);
    dragOffset.current = null;
    walkPauseUntil.current = performance.now() + manualPlacementPauseMs;
    walkTarget.current = null;
    dispatch({
      type: "drag-end",
      position: clampToWorkArea(release, getWorkArea(), petSize),
    });
  }

  return (
    <main
      className="pet-shell"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <StatusBars mood={state.stats.mood} energy={state.stats.energy} />
      <Bubble text={state.bubble} />
      <MikaSprite config={mikaConfig} animationKey={animationKey} paused={state.paused} />
      <Dessert onFeed={handleFeed} />
      {settingsOpen ? (
        <SettingsPanel
          paused={state.paused}
          onPausedChange={(paused) => dispatch({ type: "set-paused", paused })}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </main>
  );
}
