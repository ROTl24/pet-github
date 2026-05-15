import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";
import { useEffect, useMemo, useReducer, useRef, useState, type PointerEvent } from "react";

import { Bubble } from "./components/Bubble";
import { Dessert } from "./components/Dessert";
import { MikaSprite } from "./components/MikaSprite";
import { StatusBars } from "./components/StatusBars";
import { chooseMode, getAnimationKey } from "./pet/animation";
import {
  expireActivity,
  recordActivityPulse,
  shouldShowRestReminder,
  type ActivitySession,
} from "./pet/activity";
import { mikaConfig } from "./pet/mikaConfig";
import { snapToBottomLine, type Point, type WorkArea } from "./pet/movement";
import { createInitialPetState, petReducer } from "./pet/reducer";
import { isLowEnergy } from "./pet/stats";

const petSize = { width: 240, height: 300 };
const bottomMargin = 12;
const initialWorkArea: WorkArea = {
  x: 0,
  y: 0,
  width: window.screen.availWidth,
  height: window.screen.availHeight,
};

function getPointerPosition(event: PointerEvent, offset: Point): Point {
  return {
    x: event.screenX - offset.x,
    y: event.screenY - offset.y,
  };
}

export function PetApp() {
  const startPosition = useMemo(
    () =>
      snapToBottomLine(
        { x: initialWorkArea.width - petSize.width - 80, y: 0 },
        initialWorkArea,
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
  const dragOffset = useRef<Point | null>(null);

  const mode = chooseMode({
    paused: state.paused,
    dragging: state.dragging,
    eating: state.eating,
    lowEnergy: isLowEnergy(state.stats),
    active: state.active,
    walking: false,
  });
  const animationKey = getAnimationKey(mode, state.direction);

  useEffect(() => {
    void getCurrentWindow().setPosition(new LogicalPosition(state.position.x, state.position.y));
  }, [state.position.x, state.position.y]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setActivitySession((session) => {
        const next = expireActivity(session, now);
        if (next.active !== session.active) {
          dispatch({ type: next.active ? "activity-tick" : "rest-tick" });
        }
        if (shouldShowRestReminder(next, now)) {
          dispatch({ type: "set-bubble", bubble: "Time for a short break?" });
          return { ...next, lastReminderAt: now };
        }
        return next;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;

    void listen("activity-pulse", () => {
      const now = Date.now();
      setActivitySession((session) => recordActivityPulse(session, now));
      dispatch({ type: "activity-tick" });
    }).then((unlisten) => {
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
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
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
      position: getPointerPosition(event, dragOffset.current),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragOffset.current) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    const release = getPointerPosition(event, dragOffset.current);
    dragOffset.current = null;
    dispatch({
      type: "drag-end",
      position: snapToBottomLine(release, initialWorkArea, petSize, bottomMargin),
    });
  }

  function handleFeed() {
    dispatch({ type: "feed" });
    window.setTimeout(() => dispatch({ type: "eat-complete" }), 1200);
    window.setTimeout(() => dispatch({ type: "set-bubble", bubble: null }), 4000);
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
    </main>
  );
}
