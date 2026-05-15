# Mika Desktop Pet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows-first Tauri + React desktop pet app that renders Mika as a transparent always-on-top pet, supports bottom-line movement, dragging, feeding, mood/energy bars, aggregate activity response, rest reminders, and a minimal tray path.

**Architecture:** Keep the existing asset package intact and add a new `app/` desktop application. Tauri owns desktop integration and coarse system events; React owns pet rendering, movement, state, and personality rules. Pure pet logic lives in small TypeScript modules with tests before UI wiring.

**Tech Stack:** Node 24, Corepack/pnpm, Tauri 2, Rust stable, React, TypeScript, Vite, Vitest, Testing Library, ESLint, `@tauri-apps/plugin-store`, and a small Rust `rdev` activity listener.

---

## Reference Documents

- Product spec: `docs/superpowers/specs/2026-05-15-mika-desktop-pet-design.md`
- Official Tauri create project docs: https://v2.tauri.app/start/create-project/
- Official Tauri window config reference: https://v2.tauri.app/reference/config/#windowconfig
- Official Tauri system tray docs: https://v2.tauri.app/learn/system-tray/
- Official Tauri store plugin docs: https://v2.tauri.app/reference/javascript/store/

## Scope Check

This plan builds only Phase 1 from the spec: a runnable development version. It includes the code structure needed for Phase 2 packaging, but it does not require producing a final Windows installer in this pass.

Excluded from this plan:

- AI chat.
- Multiple pet catalog.
- Live2D or 3D.
- Full plugin system.
- Complex physics or window climbing.
- Cloud features.

## File Structure

Create:

- `package.json`: root workspace commands that match the repo-level workflow.
- `pnpm-workspace.yaml`: workspace declaration for `app/`.
- `app/package.json`: app scripts and dependencies.
- `app/index.html`: Vite entry.
- `app/tsconfig.json`: app TypeScript settings.
- `app/tsconfig.node.json`: Vite config TypeScript settings.
- `app/vite.config.ts`: React/Vitest config.
- `app/eslint.config.js`: lint config.
- `app/src/main.tsx`: React bootstrap.
- `app/src/PetApp.tsx`: runtime composition.
- `app/src/styles.css`: transparent-window and pet UI styles.
- `app/src/vite-env.d.ts`: Vite type declarations.
- `app/src/pet/types.ts`: shared pet domain types.
- `app/src/pet/mikaConfig.ts`: Mika sprite metadata and animation row mapping.
- `app/src/pet/stats.ts`: mood/energy update rules.
- `app/src/pet/animation.ts`: animation mode priority and transition selection.
- `app/src/pet/movement.ts`: bottom-line movement and clamping.
- `app/src/pet/reducer.ts`: pure pet state reducer.
- `app/src/pet/storage.ts`: Tauri store wrapper.
- `app/src/pet/activity.ts`: frontend activity session aggregation.
- `app/src/components/MikaSprite.tsx`: spritesheet renderer.
- `app/src/components/StatusBars.tsx`: compact mood/energy UI.
- `app/src/components/Bubble.tsx`: timed bubble display.
- `app/src/components/Dessert.tsx`: feed affordance and dessert visual.
- `app/src/components/SettingsPanel.tsx`: minimal settings UI.
- `app/src/pet/*.test.ts`: pure logic tests.
- `app/src/components/*.test.tsx`: focused component tests.
- `app/src-tauri/Cargo.toml`: Rust dependencies.
- `app/src-tauri/build.rs`: Tauri build hook.
- `app/src-tauri/tauri.conf.json`: transparent pet window config.
- `app/src-tauri/capabilities/default.json`: minimal frontend permissions.
- `app/src-tauri/src/main.rs`: Tauri builder.
- `app/src-tauri/src/tray.rs`: tray menu.
- `app/src-tauri/src/activity.rs`: coarse keyboard/mouse activity listener.
- `app/src-tauri/src/commands.rs`: small app commands.

Modify:

- `.gitignore`: add Tauri/JS build outputs if missing.

Do not modify:

- `pet/pet.json`
- `pet/spritesheet.webp`
- `assets/*`

## Task 0: Toolchain Preparation

**Files:**
- No repository files changed in this task.

- [ ] **Step 1: Check current toolchain**

Run from repo root:

```powershell
node --version
corepack --version
pnpm --version
rustc --version
cargo --version
```

Expected on this machine before setup:

- `node --version` succeeds.
- `corepack --version` succeeds.
- `pnpm`, `rustc`, and `cargo` may fail because they are not currently on `PATH`.

- [ ] **Step 2: Enable pnpm via Corepack**

Run:

```powershell
corepack enable
corepack prepare pnpm@10.15.1 --activate
pnpm --version
```

Expected:

- `pnpm --version` prints `10.15.1`.

- [ ] **Step 3: Install Rust if missing**

Run:

```powershell
rustc --version
cargo --version
```

If either command fails, install Rust using Rustup:

```powershell
winget install --id Rustlang.Rustup -e
```

Close and reopen the terminal, then run:

```powershell
rustup default stable
rustc --version
cargo --version
```

Expected:

- `rustc --version` prints a stable Rust version.
- `cargo --version` prints a Cargo version.

- [ ] **Step 4: Commit nothing**

No files changed in this task.

## Task 1: Scaffold Tauri React App And Root Workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `app/*` via official Tauri scaffold
- Modify: `.gitignore`

- [ ] **Step 1: Generate the Tauri app**

Run:

```powershell
npm create tauri-app@latest app -- --template react-ts --manager pnpm --identifier com.mika.desktoppet --tauri-version 2 --yes
```

Expected:

- `app/package.json` exists.
- `app/src-tauri/tauri.conf.json` exists.
- `app/src/main.tsx` exists.

- [ ] **Step 2: Create root workspace file**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - app
```

- [ ] **Step 3: Create root package commands**

Create `package.json`:

```json
{
  "name": "mika-desktop-pet-workspace",
  "private": true,
  "packageManager": "pnpm@10.15.1",
  "scripts": {
    "dev": "pnpm --dir app tauri:dev",
    "build": "pnpm --dir app tauri:build",
    "lint": "pnpm --dir app lint",
    "lint:fix": "pnpm --dir app lint:fix",
    "test": "pnpm --dir app test"
  }
}
```

- [ ] **Step 4: Ensure build outputs are ignored**

Append these lines to `.gitignore` only if they are not already present:

```gitignore
app/node_modules/
app/dist/
app/src-tauri/target/
app/src-tauri/gen/
*.tsbuildinfo
```

- [ ] **Step 5: Install dependencies**

Run:

```powershell
pnpm install
```

Expected:

- `pnpm-lock.yaml` exists.
- Install completes without dependency resolution errors.

- [ ] **Step 6: Run initial scaffold checks**

Run:

```powershell
pnpm --dir app build
```

Expected:

- Vite/TypeScript build succeeds.

- [ ] **Step 7: Commit**

Run:

```powershell
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore app
git commit -m "chore: scaffold mika desktop app"
```

## Task 2: Normalize App Scripts, Test, And Lint Setup

**Files:**
- Modify: `app/package.json`
- Create or modify: `app/eslint.config.js`
- Modify: `app/vite.config.ts`
- Create: `app/src/test/setup.ts`

- [ ] **Step 1: Update app scripts and dependencies**

Modify `app/package.json` so these scripts exist:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Install dev dependencies:

```powershell
pnpm --dir app add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event eslint @eslint/js typescript-eslint eslint-plugin-react-hooks globals
```

Expected:

- `app/package.json` includes the dependencies.
- `pnpm-lock.yaml` updates.

- [ ] **Step 2: Configure Vitest**

Modify `app/vite.config.ts` to include:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
```

- [ ] **Step 3: Add test setup**

Create `app/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add ESLint flat config**

Create `app/eslint.config.js`:

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src-tauri/target"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
);
```

- [ ] **Step 5: Verify tools**

Run:

```powershell
pnpm lint
pnpm test
pnpm build
```

Expected:

- Lint succeeds.
- Vitest reports no tests or passing tests depending on scaffold defaults.
- Build succeeds.

- [ ] **Step 6: Commit**

Run:

```powershell
git add app/package.json app/vite.config.ts app/eslint.config.js app/src/test/setup.ts pnpm-lock.yaml
git commit -m "chore: add app quality checks"
```

## Task 3: Add Mika Runtime Config

**Files:**
- Create: `app/src/pet/types.ts`
- Create: `app/src/pet/mikaConfig.ts`
- Create: `app/src/pet/mikaConfig.test.ts`

- [ ] **Step 1: Write failing config tests**

Create `app/src/pet/mikaConfig.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mikaConfig } from "./mikaConfig";

describe("mikaConfig", () => {
  it("describes the current spritesheet grid", () => {
    expect(mikaConfig.frameWidth).toBe(192);
    expect(mikaConfig.frameHeight).toBe(208);
    expect(mikaConfig.columns).toBe(8);
    expect(mikaConfig.rows).toBe(9);
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm --dir app test -- src/pet/mikaConfig.test.ts
```

Expected:

- FAIL because `mikaConfig.ts` does not exist.

- [ ] **Step 3: Add shared pet types**

Create `app/src/pet/types.ts`:

```ts
export type PetAnimationKey =
  | "idle"
  | "walkRight"
  | "walkLeft"
  | "work"
  | "eat"
  | "drag"
  | "tired"
  | "wave";

export type PetAnimation = {
  row: number;
  frames: number;
  durationMs: number;
  loop: boolean;
};

export type PetRuntimeConfig = {
  id: string;
  displayName: string;
  spritesheetPath: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  animations: Record<PetAnimationKey, PetAnimation>;
};

export type PetMode =
  | "idle"
  | "walk"
  | "work"
  | "drag"
  | "eat"
  | "tired"
  | "paused";

export type PetStats = {
  mood: number;
  energy: number;
};
```

- [ ] **Step 4: Add Mika runtime config**

Create `app/src/pet/mikaConfig.ts`:

```ts
import type { PetRuntimeConfig } from "./types";

export const mikaConfig = {
  id: "mika",
  displayName: "Mika",
  spritesheetPath: "../../pet/spritesheet.webp",
  frameWidth: 192,
  frameHeight: 208,
  columns: 8,
  rows: 9,
  animations: {
    idle: { row: 0, frames: 6, durationMs: 1200, loop: true },
    walkRight: { row: 1, frames: 8, durationMs: 900, loop: true },
    walkLeft: { row: 2, frames: 8, durationMs: 900, loop: true },
    wave: { row: 3, frames: 4, durationMs: 800, loop: false },
    drag: { row: 4, frames: 5, durationMs: 700, loop: true },
    eat: { row: 5, frames: 6, durationMs: 1000, loop: false },
    tired: { row: 6, frames: 6, durationMs: 1300, loop: true },
    work: { row: 7, frames: 6, durationMs: 1000, loop: true },
  },
} satisfies PetRuntimeConfig;
```

The row names are an initial runtime mapping. The implementation must visually verify rows after the first render and adjust only this file if the spritesheet rows differ.

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
pnpm --dir app test -- src/pet/mikaConfig.test.ts
```

Expected:

- PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add app/src/pet/types.ts app/src/pet/mikaConfig.ts app/src/pet/mikaConfig.test.ts
git commit -m "feat: add mika runtime config"
```

## Task 4: Implement Mood And Energy Rules

**Files:**
- Create: `app/src/pet/stats.ts`
- Create: `app/src/pet/stats.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/pet/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyActivityTick,
  applyDragAttention,
  applyFeed,
  applyRestTick,
  clampStat,
  defaultStats,
  isLowEnergy,
} from "./stats";

describe("stats", () => {
  it("clamps values to 0..100", () => {
    expect(clampStat(-1)).toBe(0);
    expect(clampStat(101)).toBe(100);
    expect(clampStat(42)).toBe(42);
  });

  it("starts Mika cheerful and energized", () => {
    expect(defaultStats).toEqual({ mood: 70, energy: 80 });
  });

  it("feeding increases mood and energy within bounds", () => {
    expect(applyFeed({ mood: 96, energy: 99 })).toEqual({ mood: 100, energy: 100 });
    expect(applyFeed({ mood: 40, energy: 50 })).toEqual({ mood: 48, energy: 53 });
  });

  it("drag attention increases mood only", () => {
    expect(applyDragAttention({ mood: 40, energy: 50 })).toEqual({ mood: 42, energy: 50 });
  });

  it("activity drains energy slowly and can nudge mood", () => {
    expect(applyActivityTick({ mood: 40, energy: 50 })).toEqual({ mood: 41, energy: 49 });
  });

  it("rest restores energy slowly", () => {
    expect(applyRestTick({ mood: 40, energy: 50 })).toEqual({ mood: 40, energy: 51 });
  });

  it("detects low energy", () => {
    expect(isLowEnergy({ mood: 80, energy: 24 })).toBe(true);
    expect(isLowEnergy({ mood: 80, energy: 25 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm --dir app test -- src/pet/stats.test.ts
```

Expected:

- FAIL because `stats.ts` does not exist.

- [ ] **Step 3: Implement stats rules**

Create `app/src/pet/stats.ts`:

```ts
import type { PetStats } from "./types";

export const defaultStats: PetStats = { mood: 70, energy: 80 };

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyFeed(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood + 8),
    energy: clampStat(stats.energy + 3),
  };
}

export function applyDragAttention(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood + 2),
    energy: clampStat(stats.energy),
  };
}

export function applyActivityTick(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood + 1),
    energy: clampStat(stats.energy - 1),
  };
}

export function applyRestTick(stats: PetStats): PetStats {
  return {
    mood: clampStat(stats.mood),
    energy: clampStat(stats.energy + 1),
  };
}

export function isLowEnergy(stats: PetStats): boolean {
  return stats.energy < 25;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
pnpm --dir app test -- src/pet/stats.test.ts
```

Expected:

- PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add app/src/pet/stats.ts app/src/pet/stats.test.ts
git commit -m "feat: add pet stats rules"
```

## Task 5: Implement Animation Mode Selection

**Files:**
- Create: `app/src/pet/animation.ts`
- Create: `app/src/pet/animation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/pet/animation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { chooseMode, getAnimationKey } from "./animation";

describe("animation", () => {
  it("applies mode priority", () => {
    expect(chooseMode({ paused: true, dragging: true, eating: true, lowEnergy: true, active: true, walking: true })).toBe("paused");
    expect(chooseMode({ paused: false, dragging: true, eating: true, lowEnergy: true, active: true, walking: true })).toBe("drag");
    expect(chooseMode({ paused: false, dragging: false, eating: true, lowEnergy: true, active: true, walking: true })).toBe("eat");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: true, active: true, walking: true })).toBe("tired");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: false, active: true, walking: true })).toBe("work");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: false, active: false, walking: true })).toBe("walk");
    expect(chooseMode({ paused: false, dragging: false, eating: false, lowEnergy: false, active: false, walking: false })).toBe("idle");
  });

  it("maps walk direction to a spritesheet animation", () => {
    expect(getAnimationKey("walk", "left")).toBe("walkLeft");
    expect(getAnimationKey("walk", "right")).toBe("walkRight");
  });

  it("maps non-walk modes directly", () => {
    expect(getAnimationKey("idle", "right")).toBe("idle");
    expect(getAnimationKey("work", "left")).toBe("work");
    expect(getAnimationKey("eat", "right")).toBe("eat");
    expect(getAnimationKey("drag", "left")).toBe("drag");
    expect(getAnimationKey("tired", "right")).toBe("tired");
    expect(getAnimationKey("paused", "left")).toBe("idle");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm --dir app test -- src/pet/animation.test.ts
```

Expected:

- FAIL because `animation.ts` does not exist.

- [ ] **Step 3: Implement animation mode selection**

Create `app/src/pet/animation.ts`:

```ts
import type { PetAnimationKey, PetMode } from "./types";

export type Direction = "left" | "right";

export type ModeInputs = {
  paused: boolean;
  dragging: boolean;
  eating: boolean;
  lowEnergy: boolean;
  active: boolean;
  walking: boolean;
};

export function chooseMode(input: ModeInputs): PetMode {
  if (input.paused) return "paused";
  if (input.dragging) return "drag";
  if (input.eating) return "eat";
  if (input.lowEnergy) return "tired";
  if (input.active) return "work";
  if (input.walking) return "walk";
  return "idle";
}

export function getAnimationKey(mode: PetMode, direction: Direction): PetAnimationKey {
  if (mode === "walk") return direction === "left" ? "walkLeft" : "walkRight";
  if (mode === "paused") return "idle";
  return mode;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
pnpm --dir app test -- src/pet/animation.test.ts
```

Expected:

- PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add app/src/pet/animation.ts app/src/pet/animation.test.ts
git commit -m "feat: add animation mode selection"
```

## Task 6: Implement Bottom-Line Movement

**Files:**
- Create: `app/src/pet/movement.ts`
- Create: `app/src/pet/movement.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/pet/movement.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clampToWorkArea, getBottomY, moveToward, snapToBottomLine } from "./movement";

describe("movement", () => {
  const workArea = { x: 0, y: 0, width: 1000, height: 700 };
  const petSize = { width: 240, height: 280 };

  it("computes bottom activity y", () => {
    expect(getBottomY(workArea, petSize, 12)).toBe(408);
  });

  it("clamps position to work area", () => {
    expect(clampToWorkArea({ x: -20, y: -10 }, workArea, petSize)).toEqual({ x: 0, y: 0 });
    expect(clampToWorkArea({ x: 900, y: 600 }, workArea, petSize)).toEqual({ x: 760, y: 420 });
  });

  it("snaps to bottom line while preserving clamped x", () => {
    expect(snapToBottomLine({ x: 900, y: 10 }, workArea, petSize, 12)).toEqual({ x: 760, y: 408 });
  });

  it("moves toward target without overshooting", () => {
    expect(moveToward(0, 10, 3)).toBe(3);
    expect(moveToward(8, 10, 3)).toBe(10);
    expect(moveToward(10, 0, 3)).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm --dir app test -- src/pet/movement.test.ts
```

Expected:

- FAIL because `movement.ts` does not exist.

- [ ] **Step 3: Implement movement helpers**

Create `app/src/pet/movement.ts`:

```ts
export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type WorkArea = { x: number; y: number; width: number; height: number };

export function getBottomY(workArea: WorkArea, petSize: Size, bottomMargin: number): number {
  return workArea.y + workArea.height - petSize.height - bottomMargin;
}

export function clampToWorkArea(point: Point, workArea: WorkArea, petSize: Size): Point {
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = workArea.x + workArea.width - petSize.width;
  const maxY = workArea.y + workArea.height - petSize.height;

  return {
    x: Math.max(minX, Math.min(maxX, Math.round(point.x))),
    y: Math.max(minY, Math.min(maxY, Math.round(point.y))),
  };
}

export function snapToBottomLine(
  point: Point,
  workArea: WorkArea,
  petSize: Size,
  bottomMargin: number,
): Point {
  const clamped = clampToWorkArea(point, workArea, petSize);
  return {
    x: clamped.x,
    y: getBottomY(workArea, petSize, bottomMargin),
  };
}

export function moveToward(current: number, target: number, step: number): number {
  if (Math.abs(target - current) <= step) return target;
  return current < target ? current + step : current - step;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
pnpm --dir app test -- src/pet/movement.test.ts
```

Expected:

- PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add app/src/pet/movement.ts app/src/pet/movement.test.ts
git commit -m "feat: add bottom-line movement helpers"
```

## Task 7: Implement Pet Reducer

**Files:**
- Create: `app/src/pet/reducer.ts`
- Create: `app/src/pet/reducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Create `app/src/pet/reducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialPetState, petReducer } from "./reducer";

describe("petReducer", () => {
  it("starts with default state", () => {
    expect(createInitialPetState({ x: 10, y: 20 })).toMatchObject({
      position: { x: 10, y: 20 },
      stats: { mood: 70, energy: 80 },
      paused: false,
      dragging: false,
      eating: false,
      active: false,
      direction: "right",
    });
  });

  it("handles drag lifecycle", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    const dragging = petReducer(initial, { type: "drag-start" });
    expect(dragging.dragging).toBe(true);
    const moved = petReducer(dragging, { type: "drag-move", position: { x: 50, y: 60 } });
    expect(moved.position).toEqual({ x: 50, y: 60 });
    const ended = petReducer(moved, { type: "drag-end", position: { x: 70, y: 80 } });
    expect(ended.dragging).toBe(false);
    expect(ended.position).toEqual({ x: 70, y: 80 });
    expect(ended.stats.mood).toBe(72);
  });

  it("handles feeding", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    const fed = petReducer(initial, { type: "feed" });
    expect(fed.eating).toBe(true);
    expect(fed.stats).toEqual({ mood: 78, energy: 83 });
  });

  it("handles activity and rest ticks", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    const active = petReducer(initial, { type: "activity-tick" });
    expect(active.active).toBe(true);
    expect(active.stats).toEqual({ mood: 71, energy: 79 });
    const rested = petReducer(active, { type: "rest-tick" });
    expect(rested.active).toBe(false);
    expect(rested.stats).toEqual({ mood: 71, energy: 80 });
  });

  it("toggles pause", () => {
    const initial = createInitialPetState({ x: 0, y: 0 });
    expect(petReducer(initial, { type: "set-paused", paused: true }).paused).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm --dir app test -- src/pet/reducer.test.ts
```

Expected:

- FAIL because `reducer.ts` does not exist.

- [ ] **Step 3: Implement reducer**

Create `app/src/pet/reducer.ts`:

```ts
import type { Direction } from "./animation";
import type { Point } from "./movement";
import { applyActivityTick, applyDragAttention, applyFeed, applyRestTick, defaultStats } from "./stats";
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
  | { type: "set-direction"; direction: Direction }
  | { type: "set-bubble"; bubble: string | null };

export function createInitialPetState(position: Point): PetState {
  return {
    position,
    stats: defaultStats,
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
    case "set-direction":
      return { ...state, direction: action.direction };
    case "set-bubble":
      return { ...state, bubble: action.bubble };
  }
}
```

- [ ] **Step 4: Run reducer test**

Run:

```powershell
pnpm --dir app test -- src/pet/reducer.test.ts
```

Expected:

- PASS.

- [ ] **Step 5: Run all pure logic tests**

Run:

```powershell
pnpm --dir app test -- src/pet
```

Expected:

- PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add app/src/pet/reducer.ts app/src/pet/reducer.test.ts
git commit -m "feat: add pet state reducer"
```

## Task 8: Add Sprite And Status Components

**Files:**
- Create: `app/src/components/MikaSprite.tsx`
- Create: `app/src/components/StatusBars.tsx`
- Create: `app/src/components/Bubble.tsx`
- Create: `app/src/components/Dessert.tsx`
- Create: `app/src/components/StatusBars.test.tsx`
- Modify: `app/src/styles.css`

- [ ] **Step 1: Write focused component test**

Create `app/src/components/StatusBars.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBars } from "./StatusBars";

describe("StatusBars", () => {
  it("renders mood and energy values", () => {
    render(<StatusBars mood={42} energy={77} />);
    expect(screen.getByLabelText("Mood 42 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Energy 77 of 100")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pnpm --dir app test -- src/components/StatusBars.test.tsx
```

Expected:

- FAIL because `StatusBars.tsx` does not exist.

- [ ] **Step 3: Create `StatusBars`**

Create `app/src/components/StatusBars.tsx`:

```tsx
type StatusBarsProps = {
  mood: number;
  energy: number;
};

export function StatusBars({ mood, energy }: StatusBarsProps) {
  return (
    <div className="status-bars" aria-label="Mika status">
      <div className="status-row" aria-label={`Mood ${mood} of 100`}>
        <span className="status-icon">Mood</span>
        <span className="status-track">
          <span className="status-fill mood" style={{ width: `${mood}%` }} />
        </span>
      </div>
      <div className="status-row" aria-label={`Energy ${energy} of 100`}>
        <span className="status-icon">Energy</span>
        <span className="status-track">
          <span className="status-fill energy" style={{ width: `${energy}%` }} />
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create sprite renderer**

Create `app/src/components/MikaSprite.tsx`:

```tsx
import type { PetAnimationKey, PetRuntimeConfig } from "../pet/types";

type MikaSpriteProps = {
  config: PetRuntimeConfig;
  animationKey: PetAnimationKey;
  paused: boolean;
};

export function MikaSprite({ config, animationKey, paused }: MikaSpriteProps) {
  const animation = config.animations[animationKey];

  return (
    <div
      className="mika-sprite"
      data-animation={animationKey}
      style={{
        width: config.frameWidth,
        height: config.frameHeight,
        backgroundImage: `url(${config.spritesheetPath})`,
        backgroundSize: `${config.frameWidth * config.columns}px ${config.frameHeight * config.rows}px`,
        "--sprite-row-y": `-${animation.row * config.frameHeight}px`,
        "--sprite-frames": animation.frames,
        "--sprite-duration": `${animation.durationMs}ms`,
        "--sprite-iterations": animation.loop ? "infinite" : "1",
        "--sprite-play-state": paused ? "paused" : "running",
      } as React.CSSProperties}
      aria-label={`Mika ${animationKey}`}
    />
  );
}
```

- [ ] **Step 5: Create bubble and dessert components**

Create `app/src/components/Bubble.tsx`:

```tsx
type BubbleProps = {
  text: string | null;
};

export function Bubble({ text }: BubbleProps) {
  if (!text) return null;
  return <div className="bubble">{text}</div>;
}
```

Create `app/src/components/Dessert.tsx`:

```tsx
type DessertProps = {
  onFeed: () => void;
};

export function Dessert({ onFeed }: DessertProps) {
  return (
    <button className="dessert-button" type="button" onClick={onFeed} aria-label="Feed Mika">
      Cake
    </button>
  );
}
```

- [ ] **Step 6: Add component styles**

Append to `app/src/styles.css`:

```css
html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  user-select: none;
}

.pet-shell {
  position: relative;
  width: 240px;
  height: 300px;
  background: transparent;
}

.mika-sprite {
  position: absolute;
  left: 24px;
  bottom: 20px;
  background-repeat: no-repeat;
  background-position: 0 var(--sprite-row-y);
  animation: mika-frames var(--sprite-duration) steps(var(--sprite-frames)) var(--sprite-iterations);
  animation-play-state: var(--sprite-play-state);
  image-rendering: auto;
}

@keyframes mika-frames {
  from {
    background-position: 0 var(--sprite-row-y);
  }
  to {
    background-position: calc(-192px * var(--sprite-frames)) var(--sprite-row-y);
  }
}

.status-bars {
  position: absolute;
  left: 20px;
  top: 8px;
  display: grid;
  gap: 4px;
  width: 170px;
  padding: 6px 8px;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 8px;
  background: rgb(20 24 31 / 58%);
  color: white;
  font: 11px/1.2 system-ui, sans-serif;
  backdrop-filter: blur(8px);
}

.status-row {
  display: grid;
  grid-template-columns: 42px 1fr;
  align-items: center;
  gap: 6px;
}

.status-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 22%);
}

.status-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.status-fill.mood {
  background: #f87171;
}

.status-fill.energy {
  background: #60a5fa;
}

.bubble {
  position: absolute;
  left: 18px;
  top: 56px;
  max-width: 190px;
  padding: 8px 10px;
  border-radius: 8px;
  background: white;
  color: #1f2937;
  font: 12px/1.35 system-ui, sans-serif;
  box-shadow: 0 8px 22px rgb(15 23 42 / 18%);
}

.dessert-button {
  position: absolute;
  right: 10px;
  bottom: 26px;
  width: 46px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: #fef3c7;
  color: #78350f;
  font: 11px/1 system-ui, sans-serif;
  cursor: pointer;
}
```

- [ ] **Step 7: Run component test**

Run:

```powershell
pnpm --dir app test -- src/components/StatusBars.test.tsx
```

Expected:

- PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
git add app/src/components app/src/styles.css
git commit -m "feat: add mika sprite status components"
```

## Task 9: Wire React Pet Runtime

**Files:**
- Modify: `app/src/PetApp.tsx`
- Modify: `app/src/main.tsx`
- Create: `app/src/pet/activity.ts`
- Create: `app/src/pet/storage.ts`

- [ ] **Step 1: Create frontend activity helper**

Create `app/src/pet/activity.ts`:

```ts
export type ActivitySession = {
  active: boolean;
  activeStartedAt: number | null;
  lastPulseAt: number | null;
  lastReminderAt: number | null;
};

export const activityConfig = {
  activeWindowMs: 30_000,
  workStartMs: 120_000,
  restReminderMs: 45 * 60_000,
  reminderCooldownMs: 20 * 60_000,
};

export function recordActivityPulse(session: ActivitySession, now: number): ActivitySession {
  return {
    ...session,
    active: true,
    activeStartedAt: session.activeStartedAt ?? now,
    lastPulseAt: now,
  };
}

export function expireActivity(session: ActivitySession, now: number): ActivitySession {
  if (!session.lastPulseAt || now - session.lastPulseAt <= activityConfig.activeWindowMs) {
    return session;
  }
  return {
    ...session,
    active: false,
    activeStartedAt: null,
  };
}

export function shouldShowRestReminder(session: ActivitySession, now: number): boolean {
  if (!session.activeStartedAt) return false;
  if (now - session.activeStartedAt < activityConfig.restReminderMs) return false;
  if (session.lastReminderAt && now - session.lastReminderAt < activityConfig.reminderCooldownMs) return false;
  return true;
}
```

- [ ] **Step 2: Create storage wrapper**

Create `app/src/pet/storage.ts`:

```ts
import { LazyStore } from "@tauri-apps/plugin-store";
import type { Point } from "./movement";
import type { PetStats } from "./types";

export type PersistedPetState = {
  stats: PetStats;
  position: Point;
  scale: number;
  activityResponseEnabled: boolean;
  restReminderEnabled: boolean;
  paused: boolean;
};

const store = new LazyStore("mika-pet-state.json");

export async function loadPersistedPetState(): Promise<PersistedPetState | null> {
  const value = await store.get<PersistedPetState>("petState");
  return value ?? null;
}

export async function savePersistedPetState(value: PersistedPetState): Promise<void> {
  await store.set("petState", value);
  await store.save();
}
```

- [ ] **Step 3: Install Tauri store plugin dependencies**

Run:

```powershell
pnpm --dir app add @tauri-apps/plugin-store
pnpm --dir app tauri add store
```

Expected:

- `app/src-tauri/Cargo.toml` includes `tauri-plugin-store`.
- `app/package.json` includes `@tauri-apps/plugin-store`.

- [ ] **Step 4: Replace `PetApp.tsx` with runtime composition**

Modify `app/src/PetApp.tsx`:

```tsx
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Bubble } from "./components/Bubble";
import { Dessert } from "./components/Dessert";
import { MikaSprite } from "./components/MikaSprite";
import { StatusBars } from "./components/StatusBars";
import { chooseMode, getAnimationKey } from "./pet/animation";
import { expireActivity, recordActivityPulse, shouldShowRestReminder, type ActivitySession } from "./pet/activity";
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

function getPointerPosition(event: React.PointerEvent): Point {
  return { x: event.screenX - petSize.width / 2, y: event.screenY - petSize.height / 2 };
}

export function PetApp() {
  const startPosition = useMemo(
    () => snapToBottomLine({ x: initialWorkArea.width - petSize.width - 80, y: 0 }, initialWorkArea, petSize, bottomMargin),
    [],
  );
  const [state, dispatch] = useReducer(petReducer, startPosition, createInitialPetState);
  const [activitySession, setActivitySession] = useState<ActivitySession>({
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
    let cleanup = () => {};
    void listen("activity-pulse", () => {
      const now = Date.now();
      setActivitySession((session) => recordActivityPulse(session, now));
      dispatch({ type: "activity-tick" });
    }).then((unlisten) => {
      cleanup = unlisten;
    });
    return () => cleanup();
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOffset.current = {
      x: event.screenX - state.position.x,
      y: event.screenY - state.position.y,
    };
    dispatch({ type: "drag-start" });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragOffset.current) return;
    dispatch({
      type: "drag-move",
      position: {
        x: event.screenX - dragOffset.current.x,
        y: event.screenY - dragOffset.current.y,
      },
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragOffset.current = null;
    const release = getPointerPosition(event);
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
```

- [ ] **Step 5: Ensure `main.tsx` imports styles and renders `PetApp`**

Modify `app/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { PetApp } from "./PetApp";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PetApp />
  </React.StrictMode>,
);
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
pnpm test
pnpm build
```

Expected:

- Tests pass.
- Build succeeds.

- [ ] **Step 7: Commit**

Run:

```powershell
git add app/src/PetApp.tsx app/src/main.tsx app/src/pet/activity.ts app/src/pet/storage.ts app/package.json app/src-tauri/Cargo.toml pnpm-lock.yaml
git commit -m "feat: wire mika pet runtime"
```

## Task 10: Configure Tauri Window, Tray, And Activity Listener

**Files:**
- Modify: `app/src-tauri/tauri.conf.json`
- Modify: `app/src-tauri/Cargo.toml`
- Modify: `app/src-tauri/src/main.rs`
- Create: `app/src-tauri/src/tray.rs`
- Create: `app/src-tauri/src/activity.rs`
- Create: `app/src-tauri/src/commands.rs`
- Modify: `app/src-tauri/capabilities/default.json`

- [ ] **Step 1: Add Rust dependencies**

Modify `app/src-tauri/Cargo.toml` dependencies:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-store = "2"
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rdev = "0.5"
```

Keep any dependencies the scaffold already created if they are required by generated code.

- [ ] **Step 2: Configure transparent pet window**

Modify the main window in `app/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Mika Desktop Pet",
  "version": "0.1.0",
  "identifier": "com.mika.desktoppet",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Mika Desktop Pet",
        "width": 240,
        "height": 300,
        "resizable": false,
        "maximizable": false,
        "minimizable": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "shadow": false,
        "visible": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 3: Add tray module**

Create `app/src-tauri/src/tray.rs`:

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App, Emitter, Manager,
};

pub fn setup_tray(app: &App) -> tauri::Result<()> {
    let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide Mika", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", "Pause/Resume", true, None::<&str>)?;
    let feed = MenuItem::with_id(app, "feed", "Feed Mika", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_hide, &pause, &feed, &settings, &quit])?;

    TrayIconBuilder::new()
        .tooltip("Mika Desktop Pet")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show_hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(true) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "pause" => {
                let _ = app.emit("tray-pause-toggle", ());
            }
            "feed" => {
                let _ = app.emit("tray-feed", ());
            }
            "settings" => {
                let _ = app.emit("tray-settings", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
```

- [ ] **Step 4: Add activity listener**

Create `app/src-tauri/src/activity.rs`:

```rust
use rdev::{listen, Event, EventType};
use std::{
    sync::{Arc, Mutex},
    thread,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter};

fn is_activity_event(event: &Event) -> bool {
    matches!(
        event.event_type,
        EventType::KeyPress(_)
            | EventType::ButtonPress(_)
            | EventType::MouseMove { .. }
            | EventType::Wheel { .. }
    )
}

pub fn start_activity_listener(app: AppHandle) {
    thread::spawn(move || {
        let last_emit = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(2)));
        let callback_last_emit = Arc::clone(&last_emit);

        let callback = move |event: Event| {
            if !is_activity_event(&event) {
                return;
            }

            let Ok(mut last) = callback_last_emit.lock() else {
                return;
            };

            if last.elapsed() < Duration::from_secs(1) {
                return;
            }

            *last = Instant::now();
            let _ = app.emit("activity-pulse", ());
        };

        if let Err(error) = listen(callback) {
            eprintln!("activity listener failed: {error:?}");
        }
    });
}
```

- [ ] **Step 5: Add commands module**

Create `app/src-tauri/src/commands.rs`:

```rust
#[tauri::command]
pub fn ping() -> &'static str {
    "pong"
}
```

- [ ] **Step 6: Wire Tauri builder**

Modify `app/src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod activity;
mod commands;
mod tray;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            tray::setup_tray(app)?;
            activity::start_activity_listener(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::ping])
        .run(tauri::generate_context!())
        .expect("error while running Mika Desktop Pet");
}
```

- [ ] **Step 7: Ensure frontend permissions include events, window, and store**

Modify `app/src-tauri/capabilities/default.json` so the frontend can use window APIs and store APIs. Keep generated permission entries and include these permissions if missing:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for Mika Desktop Pet",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:event:default",
    "store:default"
  ]
}
```

- [ ] **Step 8: Build Rust project**

Run:

```powershell
pnpm --dir app tauri build --debug
```

Expected:

- Rust compiles.
- If `rdev` requires an additional Windows dependency, the error names it directly. Install the named dependency and rerun this step.

- [ ] **Step 9: Commit**

Run:

```powershell
git add app/src-tauri
git commit -m "feat: add tauri desktop integration"
```

## Task 11: Handle Tray Events And Settings UI In React

**Files:**
- Modify: `app/src/PetApp.tsx`
- Create: `app/src/components/SettingsPanel.tsx`
- Modify: `app/src/styles.css`

- [ ] **Step 1: Create settings panel**

Create `app/src/components/SettingsPanel.tsx`:

```tsx
type SettingsPanelProps = {
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
  onClose: () => void;
};

export function SettingsPanel({ paused, onPausedChange, onClose }: SettingsPanelProps) {
  return (
    <section className="settings-panel" aria-label="Mika settings">
      <label className="settings-row">
        <input type="checkbox" checked={paused} onChange={(event) => onPausedChange(event.currentTarget.checked)} />
        Pause Mika
      </label>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Listen for tray events in `PetApp.tsx`**

Add state:

```tsx
const [settingsOpen, setSettingsOpen] = useState(false);
```

Add this effect in `PetApp`:

```tsx
useEffect(() => {
  const cleanups: Array<() => void> = [];

  void listen("tray-feed", () => handleFeed()).then((unlisten) => cleanups.push(unlisten));
  void listen("tray-pause-toggle", () => {
    dispatch({ type: "set-paused", paused: !state.paused });
  }).then((unlisten) => cleanups.push(unlisten));
  void listen("tray-settings", () => {
    setSettingsOpen(true);
  }).then((unlisten) => cleanups.push(unlisten));

  return () => cleanups.forEach((cleanup) => cleanup());
}, [state.paused]);
```

Render settings panel inside `<main>`:

```tsx
{settingsOpen ? (
  <SettingsPanel
    paused={state.paused}
    onPausedChange={(paused) => dispatch({ type: "set-paused", paused })}
    onClose={() => setSettingsOpen(false)}
  />
) : null}
```

Import it:

```tsx
import { SettingsPanel } from "./components/SettingsPanel";
```

- [ ] **Step 3: Add settings styles**

Append to `app/src/styles.css`:

```css
.settings-panel {
  position: absolute;
  inset: 10px;
  z-index: 10;
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 12px;
  border-radius: 8px;
  background: rgb(255 255 255 / 92%);
  color: #111827;
  font: 12px/1.4 system-ui, sans-serif;
  box-shadow: 0 12px 30px rgb(15 23 42 / 24%);
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

- [ ] **Step 4: Run checks**

Run:

```powershell
pnpm lint
pnpm test
pnpm build
```

Expected:

- All checks pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add app/src/PetApp.tsx app/src/components/SettingsPanel.tsx app/src/styles.css
git commit -m "feat: connect tray controls"
```

## Task 12: Persist State

**Files:**
- Modify: `app/src/PetApp.tsx`
- Modify: `app/src/pet/reducer.ts`
- Modify: `app/src/pet/reducer.test.ts`

- [ ] **Step 1: Extend reducer to hydrate state**

Add action to `PetAction`:

```ts
| { type: "hydrate"; state: Partial<Pick<PetState, "position" | "stats" | "paused">> }
```

Add reducer case:

```ts
case "hydrate":
  return {
    ...state,
    ...action.state,
  };
```

- [ ] **Step 2: Add reducer test for hydrate**

Append to `app/src/pet/reducer.test.ts`:

```ts
it("hydrates persisted state", () => {
  const initial = createInitialPetState({ x: 0, y: 0 });
  const hydrated = petReducer(initial, {
    type: "hydrate",
    state: {
      position: { x: 12, y: 34 },
      stats: { mood: 55, energy: 66 },
      paused: true,
    },
  });
  expect(hydrated.position).toEqual({ x: 12, y: 34 });
  expect(hydrated.stats).toEqual({ mood: 55, energy: 66 });
  expect(hydrated.paused).toBe(true);
});
```

- [ ] **Step 3: Load persisted state in `PetApp`**

Import storage helpers:

```tsx
import { loadPersistedPetState, savePersistedPetState } from "./pet/storage";
```

Add effect:

```tsx
useEffect(() => {
  void loadPersistedPetState().then((persisted) => {
    if (!persisted) return;
    dispatch({
      type: "hydrate",
      state: {
        position: persisted.position,
        stats: persisted.stats,
        paused: persisted.paused,
      },
    });
  });
}, []);
```

- [ ] **Step 4: Save persisted state after changes**

Add effect:

```tsx
useEffect(() => {
  const saveTimer = window.setTimeout(() => {
    void savePersistedPetState({
      stats: state.stats,
      position: state.position,
      scale: 1,
      activityResponseEnabled: true,
      restReminderEnabled: true,
      paused: state.paused,
    });
  }, 500);

  return () => window.clearTimeout(saveTimer);
}, [state.position, state.stats, state.paused]);
```

- [ ] **Step 5: Run checks**

Run:

```powershell
pnpm lint
pnpm test
pnpm build
```

Expected:

- All checks pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add app/src/PetApp.tsx app/src/pet/reducer.ts app/src/pet/reducer.test.ts
git commit -m "feat: persist pet state"
```

## Task 13: Manual Desktop Verification

**Files:**
- Modify only if verification finds a bug.

- [ ] **Step 1: Run desktop app**

Run:

```powershell
pnpm dev
```

Expected:

- Tauri dev window opens.
- Mika appears in a transparent, undecorated window.
- The app does not create a normal taskbar button for the pet window.

- [ ] **Step 2: Verify visual behavior**

Manual checks:

- Mika appears above the Windows taskbar.
- Status bars are visible and do not cover Mika's face.
- Sprite animation is not blank.
- If animation rows are visually wrong, adjust only `app/src/pet/mikaConfig.ts` row values and rerun `pnpm dev`.

- [ ] **Step 3: Verify interactions**

Manual checks:

- Drag Mika with left mouse.
- Release Mika and confirm she returns to the bottom activity line.
- Click the dessert button and confirm bubble/status changes.
- Use the tray menu Feed item and confirm it triggers feeding.
- Use the tray Pause item and confirm animation pauses/resumes.
- Use the tray Show/Hide item and confirm window visibility changes.
- Use the tray Quit item and confirm app exits.

- [ ] **Step 4: Verify activity response**

Manual checks:

- Type or move the mouse outside Mika's window.
- Confirm Mika eventually enters work/think behavior or mood/energy changes.
- Confirm no key names or text appear in UI or logs.

- [ ] **Step 5: Run final checks**

Run:

```powershell
pnpm lint
pnpm test
pnpm build
```

Expected:

- All checks pass.

- [ ] **Step 6: Commit verification fixes**

If files changed during verification:

```powershell
git add app
git commit -m "fix: polish desktop pet dev behavior"
```

If no files changed, do not commit.

## Task 14: Phase 1 Completion Notes

**Files:**
- Create: `docs/superpowers/plans/2026-05-15-mika-desktop-pet-phase-1-verification.md`

- [ ] **Step 1: Record verification outcome**

Create `docs/superpowers/plans/2026-05-15-mika-desktop-pet-phase-1-verification.md`:

```md
# Mika Desktop Pet Phase 1 Verification

Date: 2026-05-15

## Commands

- `pnpm lint`: PASS
- `pnpm test`: PASS
- `pnpm build`: PASS
- `pnpm dev`: PASS

## Manual Checks

- Transparent pet window: PASS
- Bottom taskbar-safe placement: PASS
- Drag and release: PASS
- Feeding: PASS
- Mood and energy bars: PASS
- Tray show/hide, pause, feed, settings, quit: PASS
- Aggregate activity response: PASS
- No captured key text displayed or stored: PASS

## Notes

- Record any visual row mapping adjustments here.
- Record any Windows-specific caveats here.
```

Replace `PASS` only with the actual outcome after running verification. If a check fails, fix the bug before marking it complete.

- [ ] **Step 2: Commit verification note**

Run:

```powershell
git add docs/superpowers/plans/2026-05-15-mika-desktop-pet-phase-1-verification.md
git commit -m "docs: record mika desktop pet verification"
```

## Self-Review

### Spec Coverage

- Windows-first Tauri + React app: Task 1, Task 10.
- Bottom activity line: Task 6, Task 9, Task 13.
- Dragging: Task 7, Task 9, Task 13.
- Feeding: Task 7, Task 8, Task 9, Task 11, Task 13.
- Mood and energy: Task 4, Task 7, Task 8, Task 12.
- Status bars: Task 8, Task 13.
- Aggregate activity response: Task 9, Task 10, Task 13.
- Rest reminder: Task 9, Task 13.
- Tray/menu path: Task 10, Task 11, Task 13.
- Persistence: Task 12.
- Verification: Task 13 and Task 14.

### Placeholder Scan

No placeholder markers remain in the plan. Open implementation choices from the spec are resolved into specific first-pass choices: Tauri 2, small pet-sized window, app-local Mika config, Tauri store plugin, and `rdev` for aggregate input pulses.

### Type Consistency

The plan uses the same `PetStats`, `PetMode`, `PetAnimationKey`, `Point`, `PetState`, and `PetAction` names across tasks. Later React wiring imports the modules created by earlier tasks.
