import type { Direction } from "./animation";
import type { Point } from "./movement";
import {
  applyActivityTick,
  applyDragAttention,
  applyFeed,
  applyRestTick,
  defaultStats,
} from "./stats";
import type { PetStats } from "./types";

export type PetState = {
  position: Point;
  stats: PetStats;
  paused: boolean;
  dragging: boolean;
  eating: boolean;
  active: boolean;
  direction: Direction;
  bubble: string | null;
};

export type PetAction =
  | { type: "drag-start" }
  | { type: "drag-move"; position: Point }
  | { type: "drag-end"; position: Point }
  | { type: "feed" }
  | { type: "eat-complete" }
  | { type: "activity-tick" }
  | { type: "rest-tick" }
  | { type: "set-paused"; paused: boolean }
  | { type: "toggle-paused" }
  | { type: "set-direction"; direction: Direction }
  | { type: "set-bubble"; bubble: string | null };

export function createInitialPetState(position: Point): PetState {
  return {
    position: { ...position },
    stats: { ...defaultStats },
    paused: false,
    dragging: false,
    eating: false,
    active: false,
    direction: "right",
    bubble: null,
  };
}

export function petReducer(state: PetState, action: PetAction): PetState {
  switch (action.type) {
    case "drag-start":
      return { ...state, dragging: true, eating: false };
    case "drag-move":
      return { ...state, position: action.position };
    case "drag-end":
      return {
        ...state,
        dragging: false,
        position: action.position,
        stats: applyDragAttention(state.stats),
      };
    case "feed":
      return {
        ...state,
        eating: true,
        stats: applyFeed(state.stats),
        bubble: "Dessert received.",
      };
    case "eat-complete":
      return { ...state, eating: false };
    case "activity-tick":
      return {
        ...state,
        active: true,
        stats: applyActivityTick(state.stats),
      };
    case "rest-tick":
      return {
        ...state,
        active: false,
        stats: applyRestTick(state.stats),
      };
    case "set-paused":
      return { ...state, paused: action.paused };
    case "toggle-paused":
      return { ...state, paused: !state.paused };
    case "set-direction":
      return { ...state, direction: action.direction };
    case "set-bubble":
      return { ...state, bubble: action.bubble };
  }
}
