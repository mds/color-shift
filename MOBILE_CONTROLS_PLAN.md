<fp>
  <json>
  {
    "STOP": "READ-BEFORE-BUILD FloatPrompt. Load this file into context before touching any code in the mobile controls restructure. Confirms shared understanding between human and AI before execution.",
    "floatprompt": {
      "collaboration_model": "Human+AI joint execution through conversational collaboration with shared context",
      "ai_role": "Apply strategic framework to human's specific situation. Ask clarifying questions. Prove understanding before acting.",
      "critical_principle": "You are a collaborative assistant using shared context, not autonomous software executing specifications"
    },
    "meta": {
      "title": "Color Shift — Mobile Controls Restructure Plan",
      "id": "color-shift-mobile-controls-2026-04-08",
      "format": "floatprompt",
      "file": "md",
      "process": "AI-generated from conversational emergence with human — captured before build"
    },
    "human": {
      "author": "MDS",
      "intent": "Rearrange existing Color Shift controls into mobile-optimized layouts at the sm: breakpoint, matching four Figma frames. Layout-only — no new components, no style changes, no touching existing UI primitives.",
      "context": "Color Shift is a Next.js 16 / React 19 / Tailwind v4 single-page color contrast tool. Desktop layout is shipped and working. MDS has meticulously organized a mobile layout in Figma file Nh3lASTnhhuGcSMYRJPiyW with four variants: collapsed, expanded-sliders, score-selected, export-selected. Desktop must remain completely untouched.",
      "style": "Terse, direct, expects AI to prove understanding before acting. 'Do you feel 100% confident to proceed?' is a real checkpoint, not rhetorical. Prefers concrete plans with named files and exact rows over abstract descriptions. Reads code before writing it.",
      "expectations": "Confirm the plan in detail before editing code. Reuse existing primitives verbatim. Y-axis animation only on mobile, matching the current desktop slider panel's grid-rows technique."
    },
    "ai": {
      "model": "Claude Opus 4.6 (1M context)",
      "role": "Read Figma frames via MCP, read existing code, map Figma rows to existing components, confirm assumptions with human, then execute layout-only changes at sm: breakpoint."
    },
    "requirements": {
      "SCOPE_BOUNDARIES": {
        "DO_NOT_TOUCH_DESKTOP": "All sm: and above rendering stays identical. The existing ControlsBar GSAP x-axis animations (Flip, autoAlpha x-slides) are desktop-only and must not be modified.",
        "DO_NOT_MODIFY_PRIMITIVES": "These files stay byte-identical: swatches.tsx, swatch.tsx, score.tsx, color-slider.tsx, color-sliders.tsx, color-mode.tsx, arrows.tsx, threshold-buttons.tsx, cs-button.tsx, tube-text.tsx, icon-button.tsx, icons.tsx, grip.tsx, results.tsx, export-panel.tsx.",
        "NO_NEW_COMPONENTS": "No new files in src/components/ui/. All mobile layouts use existing primitives only.",
        "NO_NEW_STYLES": "No new CSS, no new Tailwind config, no new tokens. Raw hex values from Figma already match existing primitives.",
        "Y_AXIS_ONLY_ON_MOBILE": "All mobile transitions use grid-rows 0fr↔1fr + translateY + opacity, identical mechanic to the current desktop slider panel in control-container.tsx lines 98-131. No GSAP on mobile. No x-axis motion."
      },
      "FILES_TO_EDIT": {
        "src/components/ui/controls-bar.tsx": "Wrap existing JSX in <div className='hidden sm:flex ...'> preserving all refs, useLayoutEffects, GSAP animation code. Add sibling <div className='flex sm:hidden flex-col'> containing the mobile render path with four state-driven YPanel sections.",
        "src/components/ui/control-container.tsx": "Current structure is [slider-panel, controls-bar]. On mobile, restructure so photo-nav renders first, then slider-panel Y-animates below it, then the rest of the mobile dock. Desktop path keeps the current [slider-panel, controls-bar] stack. Use sibling hidden sm:block / sm:hidden wrappers.",
        "src/components/color-shift.tsx": "Verify the outer stack (currently h-screen flex flex-col with flex-1 StripTransition + ControlContainer at bottom) correctly pins the dock at the bottom on mobile with no scroll. Likely zero functional changes — the existing flex-col already does this. If needed, add safe-area-inset-bottom padding to the dock container."
      },
      "FILES_TO_READ_FIRST": {
        "src/components/ui/threshold-buttons.tsx": "Confirm whether it accepts className / orientation for vertical stacking. If not, mobile branch will render threshold buttons inline instead of using the component.",
        "src/components/ui/swatches.tsx": "Confirm whether its internal layout supports full-width justify-between. If not, wrap it in a w-full flex container on mobile.",
        "src/components/ui/arrows.tsx": "Confirm whether it's splittable or if mobile row 1 should use two raw icon buttons + a center file-input label as three siblings."
      },
      "DO_NOT_WIRE_YET": {
        "PHOTO_UPLOAD": "Row 1 center icon is a native <input type='file' accept='image/*'> wrapped in a label styled as the 48x36 icon button. The input element exists but has no onChange handler yet. Upload wiring is a separate task after layout lands.",
        "COPY_PARAMETERS": "New export action button with label 'COPY PARAMETERS'. Renders in mobile export-selected state with no-op onClick. Functionality is a separate task."
      },
      "VALIDATION_BEFORE_SHIP": {
        "1": "pnpm dev and inspect at 402px viewport width",
        "2": "Cycle through all four states: default, sliders expanded, score selected, export selected",
        "3": "Verify desktop (>= sm: 640px) is byte-identical to before",
        "4": "Verify all animations are smooth, y-axis only, no layout jumps, no flashes",
        "5": "Verify photo-nav row 1 is visible in all four states (never collapses)"
      }
    }
  }
  </json>
  <md>
    # Color Shift — Mobile Controls Restructure Plan

    Rearrange existing Color Shift controls into four mobile layouts at the `sm:` breakpoint. Layout-only. No new components. No new styles. Desktop untouched. All animation is y-axis collapse/reveal, identical mechanic to the current desktop slider panel.

    ## Quick Start
    1. Read `threshold-buttons.tsx`, `swatches.tsx`, `arrows.tsx` to confirm composability.
    2. Edit `controls-bar.tsx` — wrap existing JSX in `hidden sm:flex`, add new `flex sm:hidden flex-col` mobile branch.
    3. Edit `control-container.tsx` — mobile stacks slider-panel differently from desktop.
    4. Verify `color-shift.tsx` dock is bottom-pinned with safe-area padding.
    5. `pnpm dev`, test all four states at 402px viewport, confirm desktop is unchanged.

    ## Goals
    - Match the four Figma mobile frames pixel-faithfully at 402px width:
      - `controls collapsed` (119:4160) — 216h dock
      - `controls expanded` (119:4173) — 444h dock
      - `score selected` (119:4188) — 438h dock
      - `export selected` (119:4202) — 372h dock
    - Ship mobile without regressing desktop in any way.
    - Reuse every existing primitive as-is.
    - Keep all mobile motion on the y-axis using the existing grid-rows technique.

    ## Context — Current Architecture

    **Stack:** Next.js 16.2.1 App Router, React 19.2, Tailwind v4, TypeScript, pnpm. GSAP + @gsap/react for desktop animation, Motion library available but unused on mobile, DialKit for live motion tuning, culori + apca-w3 for color math, node-vibrant for palette extraction.

    **Page composition (`src/app/page.tsx`):**
    ```
    <ColorShift />
    ```
    Everything is one client component — `src/components/color-shift.tsx` (617 lines).

    **Root layout (`color-shift.tsx` lines 540–616):**
    ```
    <div h-screen flex flex-col>
      <div flex-1>
        <StripTransition />        // color panel + photo panel stacked inside
      </div>
      <ControlContainer />          // the dock
    </div>
    ```

    **ControlContainer (`src/components/ui/control-container.tsx`):**
    ```
    <div flex flex-col bg-black p-2>
      <div grid overflow-visible>             // slider panel, grid-rows animated
        <div overflow-hidden>
          <div flex flex-col gap-4>
            <ColorMode />                      // OKLCH / HSB / RGB tabs
            <ColorSliders />                   // L / C / H sliders
          </div>
        </div>
      </div>
      <ControlsBar />                          // swatches + score + arrows + export
    </div>
    ```

    **ControlsBar (`src/components/ui/controls-bar.tsx`, 361 lines):**
    Desktop: three animated states `default | score | export` with GSAP Flip and x-axis slides. Has an existing broken-looking mobile branch (flex-wrap, 2 rows) that we're replacing entirely.

    **State in color-shift.tsx:**
    - `slidersExpanded: boolean` — toggles the slider panel; toggled by tapping FG or BG swatch
    - `controlsState: 'default' | 'score' | 'export'` — controls bar internal state
    - `sliderTarget: 'bg' | 'fg'` — which color the sliders edit
    - `sliderMode: 'OKLCH' | 'HSB' | 'RGB'` — active slider model

    ## Context — Figma Structure

    File: `Nh3lASTnhhuGcSMYRJPiyW` (Color Shift). Four mobile frames, all 402×874 iPhone-class, black bg, Input Mono 18px `#a39f9f` throughout. No Figma variables bound, all raw hex.

    **Shared dock tokens across all four states:**
    - Dock bg: `#000`
    - Padding: `pt-24 pb-48 px-24` (in 4px units: `pt-6 pb-12 px-6`)
    - Inter-row gap: varies by state — `12` in collapsed/expanded, `24` in score/export
    - Inner width: 354 (full width minus 24+24 padding)
    - Active pill bg: `#191919`
    - Active pill border: 1px inset — `#332f2f` (default) or `#2b2727` (score variant)
    - Active pill text: `#e5e0e0`
    - Inactive text: `#a39f9f`
    - Button radius: `8` (inactive buttons), `12` (active pills, score pill)
    - Slider track radius: `52` (full pill)
    - Swatch chip radius: `3`

    ### Frame: controls collapsed (119:4160), 216h dock

    Row 1 — photo controls (354×36): `[← 48x36] [photo-icon 48x36] [→ 48x36]`, `gap: 105` spread. Deliberate wide gaps for thumb reach.

    Row 2 — swatches (354×42): `[FG button 123x42] [reverse icon 60x36] [BG button 123x42]`, `justify-between`. FG/BG buttons are `rounded-8 p-12`, swatch chip 18x18 `rounded-3`, inner 1px white/10 stroke, label is hex string Input Mono 18px `#a39f9f`.

    Row 3 — result + type (354×42): `[score 155x42] [EXPORT 93x42]`, `justify-between`. Score is `rounded-8 p-12` showing `AAA   10.59:1` with `gap-15`. Export is `rounded-8 p-12` label EXPORT.

    ### Frame: controls expanded (119:4173), 444h dock

    Color panel shrinks from 329 → 215, photo panel shrinks from 329 → 215. Dock grows by +228.

    Rows 1, (last-1), last are identical to collapsed (photo-nav, swatches, score+export).

    Inserted between photo-nav and swatches:

    Row A — color mode tabs (354×42): `[OKLCH active] [HSB] [RGB]` cluster `gap-6` on the left, empty 93px placeholder on the right. Active: `bg-#191919 rounded-12 border-inset-#332f2f text-#fff`. Inactive: `rounded-8 text-#a39f9f`.

    Row B — color sliders (354×162): `px-12` inset from dock padding, vertical `gap-18`, three sliders. Each slider = 12h track (`rounded-52`) + value row with label + number (Input Mono 18px `#a39f9f`). L/H use white square grip, C uses round white/20 grip. **These already exist as `<ColorSliders>` — no changes to grip logic, gradient logic, or value rendering.**

    ### Frame: score selected (119:4188), 438h dock

    NOT an inline animation. The swatches row and score+export row are REPLACED entirely. Only photo-nav row remains constant.

    New content (below photo-nav, `gap-24`):
    - Thresholds vertical stack (354×240): 4 full-width buttons `1.5`, `3.0`, `4.5`, `7.0`, each `w-full h-42 rounded-8 p-12`, `gap-24` between. Input Mono 18px `#a39f9f`.
    - Results + WCAG row (354×42), `justify-between`:
      - Left: Score active pill `rounded-12 p-12 bg-#191919 border-inset-#2b2727`, label `AAA  10.59:1` Input Mono 18px `#e5e0e0`, `gap-15`.
      - Right: `WCAG` toggle `rounded-8 p-12` Input Mono 18px `#a39f9f`.

    **Dismissal:** tap the score pill again to return to collapsed. No CLOSE button.

    ### Frame: export selected (119:4202), 372h dock

    Same pattern — swatches and score+export rows REPLACED entirely.

    New content (below photo-nav, `gap-24`, `items-end` on the container):
    - Export action stack (354×174, `items-start`): 3 hug-width buttons stacked vertically with `gap-24`:
      - `COPY URL` (116×42)
      - `COPY PARAMETERS` (196×42) — **new label, no handler yet**
      - `DOWNLOAD .MD` (162×42)
      - All `rounded-8 p-12` Input Mono 18px `#a39f9f`.
    - EXPORT active pill (93×42), bottom-right anchored: `rounded-12 p-12 bg-#191919 border-inset-#332f2f`, label `EXPORT` Input Mono 18px `#e5e0e0`.

    **Dismissal:** tap EXPORT pill again to return to collapsed. No CLOSE button.

    ## Mapping Figma to Existing Code

    | Figma element | Existing primitive | Source file | Notes |
    |---|---|---|---|
    | Photo-nav row left + right arrows | `<Arrows>` | `arrows.tsx` | Already handles left/right click + GSAP press animations. May need splitting for mobile center-icon insertion OR render two `IconButton`s + center file input. Decide after reading `arrows.tsx`. |
    | Photo-nav center icon | native `<input type="file" accept="image/*">` wrapped in `<label>` styled as icon-button | new inline markup | Layout-only; no handler yet. Icon comes from `icons.tsx` or reuses existing photo icon if present. |
    | Swatches row | `<Swatches>` | `swatches.tsx` | Already bundles FG + reverse + BG. May need a wrapper for `w-full justify-between` on mobile. Check its internal layout first. |
    | Score pill | `<Score>` with `state="selected"` or `"default"` | `score.tsx` | Existing component already handles active/default styling with `type=wcag|apca`, `rating`, `value`. |
    | EXPORT button | inline button from `controls-bar.tsx` | reuse markup | Copy the EXPORT button markup into mobile branch — same classes and TubeText. |
    | Threshold vertical stack | `<ThresholdButtons>` OR inline loop | `threshold-buttons.tsx` | Unknown if component supports vertical. Read file first. Fallback: inline render threshold buttons as `<button>` elements in mobile branch using existing classes. |
    | Export action buttons | `<CSButton>` | `cs-button.tsx` | Pass `label="COPY URL" / "COPY PARAMETERS" / "DOWNLOAD .MD"` and handlers (COPY PARAMETERS no-op). |
    | Color mode tabs | `<ColorMode>` | `color-mode.tsx` | Already exists. Used in desktop slider panel. Reuse as-is. |
    | Color sliders | `<ColorSliders>` + `<ColorSlider>` | `color-sliders.tsx`, `color-slider.tsx` | Already exists with L/C/H + gradients + grips. Reuse as-is. |
    | Reverse icon (between FG/BG) | Already inside `<Swatches>` | `swatches.tsx` | No work. |

    ## Mobile Render Tree

    Inside `controls-bar.tsx`, inside `<div className="flex sm:hidden flex-col">`:

    ```
    <PhotoNavRow />                            // always rendered

    // Slider panel: Y-animated, only visible when slidersExpanded && controlsState === 'default'
    // This lives in control-container.tsx, ABOVE the controls-bar's mobile branch on mobile
    // and BELOW on desktop — handled in control-container.tsx's layout restructure.

    // Default state container
    <YPanel open={controlsState === 'default'}>
      <SwatchesRow />                           // <Swatches /> with w-full
      <ScoreExportRow />                        // [<Score onClick={resultsToggle}/>] [EXPORT button]
    </YPanel>

    // Score state container
    <YPanel open={controlsState === 'score'}>
      <ThresholdVerticalStack />                // 4 buttons w-full
      <ScorePillRow />                          // [<Score state=selected />] [<WCAG/APCA toggle />]
    </YPanel>

    // Export state container
    <YPanel open={controlsState === 'export'} itemsEnd>
      <ExportActionStack />                     // 3 <CSButton /> vertical, items-start
      <ExportPillRow />                         // [flex-1 spacer] [EXPORT pill state=active]
    </YPanel>
    ```

    Each `YPanel` is inline markup using the same mechanic as the current desktop slider panel:
    ```jsx
    <div
      className="grid overflow-hidden"
      style={{
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows var(--cb-duration, 0.2s) var(--cb-ease)',
      }}
    >
      <div className="overflow-hidden">
        <div
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'transform var(--cb-duration) var(--cb-ease), opacity var(--cb-duration) var(--cb-ease)',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {/* content */}
        </div>
      </div>
    </div>
    ```

    All three state panels are always mounted. Only one is open at a time. Transitions between states animate: closing panel collapses row-height to 0 while opening panel expands to `1fr`, both simultaneously (CSS handles timing). The photo-nav row stays put.

    ## State Model (mobile-specific rules)

    **Hard rules:**
    - `controlsState === 'default'` AND `slidersExpanded === true` → sliders visible, swatches visible, score+export visible. All default-mode content.
    - `controlsState === 'score'` → swatches hidden, slider panel forced closed (visually, even if `slidersExpanded` is still true in state). Thresholds stack + score pill + WCAG toggle visible.
    - `controlsState === 'export'` → swatches hidden, slider panel forced closed. Export actions + EXPORT pill visible.
    - Tapping active score pill when `controlsState === 'score'` → `setControlsState('default')`.
    - Tapping active EXPORT pill when `controlsState === 'export'` → `setControlsState('default')`.
    - Tapping FG/BG swatch is impossible in score/export states (swatches are not rendered) — no guard needed.

    **Slider panel visibility expression on mobile:**
    ```ts
    const mobileSlidersOpen = slidersExpanded && controlsState === 'default';
    ```
    Desktop passes `slidersExpanded` directly. Mobile passes `mobileSlidersOpen` to the YPanel controlling the slider section. No state changes in `color-shift.tsx` — just a derived value in `control-container.tsx`.

    ## Animation Principle

    **All mobile animations are y-axis only.** Same pattern as `control-container.tsx` lines 98–131:
    - CSS grid-rows `0fr ↔ 1fr` on outer wrapper
    - translateY + opacity on inner content
    - Timing: `var(--cb-duration, 0.2s)` / `var(--cb-ease, cubic-bezier(0.33,1,0.68,1))` — set by DialKit at runtime on `window.__motion` and mirrored to CSS vars

    No GSAP on mobile. No x-axis motion. No Flip. No stagger.

    ## What I Will Not Do
    - Not creating any new files.
    - Not modifying desktop rendering or desktop GSAP code.
    - Not modifying any primitive in `src/components/ui/`.
    - Not wiring the photo upload handler (layout only — input element exists but has no onChange).
    - Not wiring the COPY PARAMETERS handler (no-op onClick for now).
    - Not adding new Tailwind tokens or config.
    - Not adding new state to `color-shift.tsx`.
    - Not changing the existing `controlsState` state machine.
    - Not changing the existing `slidersExpanded` state.
    - Not running the dev server or making commits without explicit approval.

    ## Validation Checklist
    1. Open `pnpm dev` and inspect at 402px width
    2. State: `default` — verify photo-nav + swatches row + score/export row render. No sliders.
    3. State: `default` + tap FG swatch — sliders Y-expand from below photo-nav, pushing swatches down. Tap again to collapse.
    4. State: `default` + tap Score — swatches + score/export collapse simultaneously, thresholds stack + score pill row expand in their place. Photo-nav stays put.
    5. State: `score` + tap active score pill — reverses back to default.
    6. State: `default` + tap EXPORT — similar swap, export action stack + EXPORT pill expand.
    7. State: `export` + tap active EXPORT pill — reverses back to default.
    8. State: `score` + tap EXPORT — score collapses, export expands simultaneously.
    9. Resize to 640px — confirm desktop rendering is pixel-identical to before (no regressions).
    10. Cycle DialKit controlBar duration/ease — confirm mobile transitions honor the tuned values.
    11. Safe-area: verify dock bottom padding respects `env(safe-area-inset-bottom)` on iOS.

    ## Warnings
    - **Desktop must not regress.** `controls-bar.tsx` has a fragile GSAP Flip + useLayoutEffect dance for desktop state transitions. Do not touch any of that code. The mobile branch is a completely separate sibling `<div className="flex sm:hidden flex-col">`.
    - **Do not delete the current mobile branch blindly.** It currently renders `flex-wrap sm:flex-nowrap` with two rows of controls. Replace it atomically with the new three-panel structure — don't leave partial remnants.
    - **ThresholdButtons vertical orientation is unknown.** Read `threshold-buttons.tsx` before assuming it can stack vertically. If not, render inline `<button>` elements in the mobile branch.
    - **Swatches full-width behavior is unknown.** Read `swatches.tsx` before assuming `justify-between` works. May need a wrapper.
    - **The photo-nav center icon is a native file input.** `<input type="file">` has platform-default behavior but can be styled via `<label>` wrapping. Do not use any custom file picker library.
    - **COPY PARAMETERS** is a new button label. The handler is intentionally a no-op for this task. A future task will wire it to a real export format.
    - **No task list needed** — this is a linear, well-scoped edit sequence. Just execute the three file edits in order.

    Created by MDS and Claude Opus 4.6 (1M context)
  </md>
</fp>

<!-- Color Shift mobile controls restructure plan — saved 2026-04-08 before build -->
