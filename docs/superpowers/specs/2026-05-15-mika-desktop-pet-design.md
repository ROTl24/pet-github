# Mika Desktop Pet MVP Design

Date: 2026-05-15
Status: self-reviewed design draft

## Summary

Build Mika as a Windows-first desktop pet using Tauri, React, and TypeScript. The first release should make Mika feel alive on the desktop without turning the project into a full pet platform or AI assistant.

The MVP is a balanced desktop pet:

- Quiet companion: idle, walk, think, wave, and rest near the bottom of the screen.
- Interactive pet: drag Mika and feed tiny desserts.
- Light work buddy: react to aggregate keyboard/mouse activity and remind the user to rest.

The first delivery target is a runnable development build. After the behavior feels right, package it as a Windows installer.

## User Decisions

- Product direction: balanced mix of quiet companion, interactive toy, and light work buddy.
- Platform: Windows first.
- Technology: Tauri + React + TypeScript.
- Activity area: bottom of the primary screen, above the taskbar/work area edge.
- Core interactions: left-drag Mika, feed tiny desserts, react to keyboard/mouse activity.
- Keyboard/mouse behavior: companionship feedback first, light focus/rest logic second, no per-key mimic animation.
- State model: `mood` and `energy`.
- State UI: always-visible small mood/energy status bars.
- Delivery: first a runnable dev version, then a Windows installer.

## Reference Products

These projects inform the design but are not dependencies:

- WindowPet: Tauri/React overlay pet with transparent windows, tray behavior, pet configuration, and startup support.
- BongoCat Next: Tauri desktop pet with Live2D and keyboard/mouse response.
- VPet: WPF desktop pet with a much broader simulation and plugin-like ecosystem.
- Clawd on Desk and OpenPets: Electron desktop pets focused on AI coding-agent status.
- Shimeji-style pets: classic bottom/edge desktop character behavior.

The recommendation is closest to WindowPet in technical shape, but smaller in scope.

## Goals

1. Mika appears as a transparent, always-on-top desktop character.
2. Mika stays on a bottom activity line above the taskbar by default.
3. Mika can idle, walk, work/think, eat, be dragged, and become tired.
4. The user can feed Mika a small dessert.
5. The app tracks simple `mood` and `energy` values and shows them near Mika.
6. Aggregate keyboard/mouse activity nudges Mika into a work-buddy state.
7. Long active sessions trigger gentle rest reminders.
8. The app has a minimal tray/menu path for pause, hide/show, settings, and quit.
9. The app persists basic state and settings locally.

## Non-Goals

- AI chat.
- Full multi-pet catalog or marketplace.
- Live2D or 3D rendering.
- Complex physics, climbing windows, or screen-edge traversal beyond the bottom line.
- Detailed keystroke logging, screenshots, or content capture.
- Cloud sync or accounts.
- Plugin system.
- General-purpose pet package editor.

## Assets

Use the current Mika assets:

- `pet/pet.json`
- `pet/spritesheet.webp`
- Preview images in `assets/`

Current spritesheet dimensions:

- `pet/spritesheet.webp`: 1536 x 1872
- Implied grid: 8 columns x 9 rows
- Implied frame size: 192 x 208

The existing `pet.json` only identifies the pet and spritesheet path. For MVP, keep it compatible and define Mika's animation mapping in app code or an app-local default config. Do not force the asset repo into a larger pet-package format until there is a real need.

Future-compatible app-local shape:

```ts
type PetAnimationKey =
  | "idle"
  | "walkRight"
  | "walkLeft"
  | "work"
  | "eat"
  | "drag"
  | "tired"
  | "wave";

type PetAnimation = {
  row: number;
  frames: number;
  durationMs: number;
  loop: boolean;
};

type PetRuntimeConfig = {
  id: string;
  displayName: string;
  spritesheetPath: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  animations: Record<PetAnimationKey, PetAnimation>;
};
```

## Architecture

```text
Tauri app
+-- Rust desktop layer
|   +-- transparent always-on-top pet window
|   +-- work-area/screen geometry
|   +-- tray/menu commands
|   +-- local settings and state persistence
|   +-- aggregate keyboard/mouse activity bridge
|   +-- safe app lifecycle commands
|
+-- React/TypeScript pet layer
    +-- spritesheet renderer
    +-- pet behavior state machine
    +-- bottom-line movement controller
    +-- drag/feed/activity interactions
    +-- mood/energy model
    +-- status bars and bubbles
    +-- settings surface
```

### Rust Responsibilities

The Tauri/Rust layer should expose narrow commands and events:

- Create a transparent, borderless, non-resizable window.
- Keep the pet window above regular app windows.
- Skip the taskbar for the pet window.
- Compute usable screen work area, avoiding the taskbar.
- Persist app settings and pet state.
- Provide tray commands: show/hide, pause/resume, settings, quit.
- Emit aggregate activity events such as `user-active`, `user-idle`, and `activity-pulse`.

Rust should not own pet personality rules. It should only provide platform facts and OS-level capabilities.

### React Responsibilities

React owns all user-visible pet behavior:

- Choose animations.
- Move Mika along the bottom activity line.
- Process drag and feed gestures.
- Apply mood/energy changes.
- Show status bars and bubbles.
- Decide when Mika reacts to work activity or rest reminders.

This keeps iteration fast because most personality tuning is TypeScript/CSS, not Rust.

## Window Model

### Main Pet Window

The MVP should use one transparent pet window sized around Mika plus nearby UI:

- Width: enough for sprite, status bars, dessert animation, and bubble.
- Height: enough for sprite plus bubble/status overlay.
- Transparent background.
- No native frame or shadow.
- Always on top.
- Skips taskbar.
- Starts near the lower-right or lower-center work area.

The pet window follows Mika. Because the MVP only uses bottom-line movement, a full-screen transparent overlay is not necessary for the first version. A small moving window is simpler, less invasive, and easier to click.

### Settings Window

Use either a second Tauri window or a small modal in the same window. Prefer a second settings window if the app needs regular controls. Keep first settings minimal:

- Scale.
- Pause/resume animation.
- Enable/disable keyboard/mouse activity response.
- Enable/disable rest reminders.
- Reset mood/energy.
- Quit.

### Tray Menu

Even though the user-selected core interactions did not include a right-click menu, the app needs a safe control path. Minimal tray/menu:

- Show/Hide Mika.
- Pause/Resume.
- Feed Mika.
- Settings.
- Quit.

## Desktop Movement

Mika has a bottom activity line:

```text
workArea.bottom - petHeight - bottomMargin
```

Behavior:

- Mika walks left or right along the activity line.
- Mika idles at random intervals.
- Mika occasionally waves or thinks.
- Mika does not climb, jump to top edges, or attach to arbitrary windows in MVP.
- If dragged and released, Mika smoothly returns to the nearest valid bottom-line point.
- Window position is clamped inside the current work area.

Multi-monitor support can be simple for MVP:

- Use the primary monitor initially.
- If Mika is dragged to another monitor and work-area detection is reliable, snap to that monitor's bottom line.
- If that adds risk, defer multi-monitor intelligence and clamp to primary work area.

## Interaction Design

### Drag

Input:

- Left mouse down on Mika starts dragging.
- Mouse move updates pet position.
- Mouse up ends dragging.

Rules:

- While dragging, animation state is `drag`.
- Mood increases slightly the first time the user drags in a short window.
- On release, Mika snaps or glides back to the bottom activity line.
- Do not make drag change energy significantly.

### Feeding

Input options:

- Tray/menu "Feed Mika".
- Small dessert button near Mika.
- Optional keyboard shortcut later, not MVP.

Behavior:

- A tiny dessert appears near Mika.
- Mika enters `eat`.
- Mood increases.
- Energy increases slightly.
- Bubble appears with one short line.

Limits:

- Feeding has a short cooldown to avoid spam.
- Overfeeding should not create another stat. If needed, repeated feeding within cooldown simply shows a playful "later" bubble.

### Keyboard/Mouse Activity

The app should detect aggregate activity, not content:

- Do not store key names.
- Do not store mouse coordinates long-term.
- Do not capture screenshots or active window titles.
- Convert events to coarse pulses such as "activity happened".

Behavior:

- During sustained activity, Mika can enter `work`/`think`.
- Mood can increase slightly because Mika is accompanying the user.
- Energy decreases slowly during long active sessions.
- After a threshold, show a rest bubble.

Suggested thresholds for MVP:

- Active pulse window: 30 seconds.
- Work session starts after 2 minutes of activity.
- Rest reminder after 45 minutes of sustained activity.
- Reminder cooldown: 20 minutes.

These values should be settings later, but hardcoded constants are acceptable for the first dev version.

## Mood And Energy

### Ranges

Use normalized integer values:

```ts
type PetStats = {
  mood: number;   // 0..100
  energy: number; // 0..100
};
```

Default:

```ts
{ mood: 70, energy: 80 }
```

### Updates

Mood:

- Feed: +8, cooldown-limited.
- Friendly interaction/drag: +2, cooldown-limited.
- Long active work with Mika present: +1 occasionally.
- Idle neglect over long periods: -1 slowly, optional in MVP.

Energy:

- Sustained user activity: -1 every few minutes.
- Rest/idle period: +1 every few minutes.
- Feed: +3.
- If energy < 25, Mika more often enters `tired`.

Keep stat math simple and deterministic. This makes testing easy and avoids hidden simulation complexity.

### Persistence

Persist:

- `mood`
- `energy`
- `lastPosition`
- `scale`
- `activityResponseEnabled`
- `restReminderEnabled`
- `paused`

Recommended storage:

- Tauri store plugin or app-local JSON file.

Persist at safe intervals:

- On app close.
- After stat-changing interactions.
- Debounced periodic save, for example every 30 seconds after changes.

## Status UI

Use a compact always-visible status UI attached to Mika:

- Two tiny horizontal bars or icon+bar rows.
- Mood uses a heart-like icon or label.
- Energy uses a bolt-like icon or label.
- The UI should not exceed Mika's visual footprint too much.
- Status should stay readable at common scales.

Placement:

- Default above Mika or to the side, whichever avoids overlapping the sprite.
- During bubbles, status can remain visible but lower visual priority.

Avoid a large HUD. The desktop should still feel clean.

## Animation State Machine

### States

```ts
type PetMode =
  | "idle"
  | "walk"
  | "work"
  | "drag"
  | "eat"
  | "tired"
  | "paused";
```

### Priority

When multiple conditions apply, choose states in this order:

1. `paused`
2. `drag`
3. `eat`
4. `tired`
5. `work`
6. `walk`
7. `idle`

This avoids ambiguous behavior, such as eating and dragging at the same time.

### Transitions

- `idle -> walk`: random timer.
- `walk -> idle`: reached target or random timer.
- `idle/walk -> work`: sustained user activity.
- `work -> tired`: energy below threshold or rest reminder due.
- `any -> drag`: pointer drag starts.
- `drag -> idle/walk`: pointer drag ends and Mika settles.
- `any non-drag -> eat`: feed action accepted.
- `eat -> idle`: eat animation completes.
- `any -> paused`: pause command.

## Bubbles

Bubbles are short and occasional. They should not become a chat system.

Examples:

- Feed: "Dessert received."
- Work start: "Focus mode on."
- Rest reminder: "Time for a short break?"
- Low energy: "Getting sleepy."

Rules:

- One bubble at a time.
- Auto-dismiss after 3-5 seconds.
- Do not show repeated bubbles too frequently.
- Keep text localizable later, but hardcoded Chinese strings are fine for MVP.

## Project Shape

The current repo is asset-only. The implementation should add an app while preserving the existing asset package.

Recommended structure:

```text
.
+-- app/
|   +-- package.json
|   +-- src/
|   |   +-- main.tsx
|   |   +-- PetApp.tsx
|   |   +-- pet/
|   |   |   +-- mikaConfig.ts
|   |   |   +-- animation.ts
|   |   |   +-- movement.ts
|   |   |   +-- stats.ts
|   |   |   +-- reducer.ts
|   |   +-- components/
|   |   |   +-- MikaSprite.tsx
|   |   |   +-- StatusBars.tsx
|   |   |   +-- Bubble.tsx
|   |   |   +-- Dessert.tsx
|   |   +-- styles.css
|   +-- src-tauri/
|       +-- tauri.conf.json
|       +-- src/
|           +-- main.rs
|           +-- window.rs
|           +-- tray.rs
|           +-- store.rs
|           +-- activity.rs
+-- pet/
|   +-- pet.json
|   +-- spritesheet.webp
+-- assets/
```

Why `app/`:

- Keeps existing asset repo clean.
- Avoids mixing generated app build files with pet asset files.
- Makes it easy to package only the desktop app later.

## Tauri Configuration

Initial window intent:

- `transparent: true`
- `decorations: false`
- `alwaysOnTop: true`
- `skipTaskbar: true`
- `resizable: false`
- no full-screen overlay for MVP

Plugins likely needed:

- Store or filesystem for settings.
- Shell/opener only if settings needs links.
- Global shortcut is not needed for MVP.

Activity listener:

- Prefer a small Rust module that emits coarse activity events.
- If using a global input crate, keep emitted payload content-free.
- Make activity response toggleable in settings.

## Error Handling

Handle these gracefully:

- Missing `spritesheet.webp`: show a small fallback error window or settings message.
- Invalid saved state: reset to defaults.
- Work-area lookup failure: use primary display dimensions with a safe bottom margin.
- Activity listener failure: continue without keyboard/mouse response and show one settings warning.
- Store write failure: keep running and retry later.

Do not crash the pet for optional features.

## Privacy

Keyboard/mouse response must be intentionally privacy-preserving:

- No key text.
- No per-key history.
- No clipboard reads.
- No screenshots.
- No active-window title collection.
- No network calls for activity features.

The settings screen should state that activity response only uses aggregate activity pulses if a visible explanation is later needed.

## Testing And Verification

### Unit Tests

Test pure TypeScript logic:

- `stats.ts`: mood/energy bounds and update rules.
- `animation.ts`: priority and transition selection.
- `movement.ts`: bottom-line clamp and snap logic.
- `reducer.ts`: drag/feed/activity events.

### Rust Tests

If logic is isolated enough:

- default settings load.
- invalid saved state fallback.
- work-area clamping helpers.

### Manual Dev Verification

Run:

```bash
pnpm install
pnpm dev
pnpm tauri dev
pnpm lint
pnpm test
pnpm build
```

Manual checks:

- Pet window is transparent and not in taskbar.
- Mika appears above the Windows taskbar.
- Mika idles and walks along the bottom.
- Drag works and release returns to bottom line.
- Feeding changes animation, bubble, mood, and energy.
- Keyboard/mouse activity triggers work state without showing captured input.
- Rest reminder appears after threshold.
- Status bars update and remain readable.
- Tray menu can pause, hide/show, open settings, and quit.
- App restarts with persisted mood/energy and position.

### Packaging Verification

After the dev version feels right:

```bash
pnpm tauri build
```

Manual installer checks:

- Installs on Windows.
- Starts without terminal.
- Tray quit works.
- Uninstall removes app cleanly.
- Saved state remains in the expected app data location.

## Phased Delivery

### Phase 1: Runnable Dev Version

Scope:

- Scaffold Tauri + React app under `app/`.
- Load Mika spritesheet.
- Render transparent pet window.
- Implement bottom-line movement.
- Implement drag.
- Implement feed action.
- Implement mood/energy and status bars.
- Implement aggregate activity response and rest reminder.
- Implement minimal tray/menu.
- Add focused tests for pure logic.

Definition of done:

- `pnpm tauri dev` runs on Windows.
- User can play with Mika as a desktop pet.
- Lint and relevant tests pass.

### Phase 2: Windows Installer

Scope:

- App icon.
- Build metadata.
- Installer target.
- Persistence path verification.
- Startup behavior decision.
- Packaging smoke test.

Definition of done:

- Windows installer builds.
- Installed app starts, runs, persists state, and quits reliably.

## Risks And Mitigations

### Transparent Window Click Behavior

Risk: transparent windows can make drag/click behavior awkward.

Mitigation: keep MVP as a small pet-sized window, not a full-screen overlay. Do not enable click-through by default until interaction is stable.

### Activity Listener Permissions Or Stability

Risk: global keyboard/mouse listeners can be platform-sensitive.

Mitigation: make activity response optional and payload-free. If listener fails, desktop pet still works.

### Scope Growth

Risk: feeding, mood, energy, settings, reminders, and packaging can expand quickly.

Mitigation: no AI chat, no inventory, no multiple pets, no plugin system, no Live2D in MVP.

### Asset Mapping Ambiguity

Risk: existing `pet.json` does not describe animation rows.

Mitigation: define Mika's animation rows in app-local `mikaConfig.ts` for MVP. Extend the pet package format only after runtime behavior is validated.

### Multi-Monitor Edge Cases

Risk: window clamping across displays can add complexity.

Mitigation: start with primary monitor. Add smarter monitor snapping only if it is easy during implementation.

## Open Decisions For Implementation

These can be decided during implementation without changing product design:

- Exact Tauri version, likely current stable Tauri 2 unless dependency compatibility argues otherwise.
- Whether settings is a separate Tauri window or a small in-app panel.
- Exact animation row mapping after visually inspecting the spritesheet.
- Exact status bar placement after rendering Mika at target scale.
- Exact rest reminder timings after testing.

## Self-Review

### Placeholder Scan

No unresolved placeholder markers remain. Open implementation choices are listed explicitly and do not block the design.

### Internal Consistency

The design consistently targets Windows-first Tauri + React, uses the existing Mika spritesheet, keeps Mika on the bottom activity line, and includes the selected interactions: drag, feed, and keyboard/mouse activity response.

### Scope Check

The design is focused enough for one implementation plan. It intentionally excludes AI chat, plugin systems, complex physics, Live2D, multi-pet catalogs, and cloud features.

### Ambiguity Check

The only meaningful ambiguity is animation row mapping, because the current pet metadata does not describe rows. The design resolves this by using an app-local Mika runtime config for MVP.

### Verification Check

The design includes automated tests for pure behavior logic and manual desktop checks for the OS-level Tauri behavior. This is appropriate because transparent windows, tray behavior, and global input activity need manual Windows verification.
