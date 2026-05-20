<fp>
  <json>
  {
    "STOP": "READ-BEFORE-BUILD FloatPrompt. Load this file into context before touching any non-trivial code in the Color Shift repo. It is the canonical, exhaustive project map — architecture, every state atom, color math (every function), slider system, photo pipeline, animation plumbing, mobile vs desktop split, every primitive, every gsap plugin, every fragility. Compiled from eleven parallel Explore-agent deep reads.",
    "floatprompt": {
      "collaboration_model": "Human+AI joint execution through conversational collaboration with shared context",
      "ai_role": "Apply strategic framework to human's specific situation. Ask clarifying questions. Prove understanding before acting.",
      "critical_principle": "You are a collaborative assistant using shared context, not autonomous software executing specifications"
    },
    "meta": {
      "title": "Color Shift — Exhaustive Project Map",
      "id": "color-shift-project-map-2026-04-08-v2",
      "format": "floatprompt",
      "file": "md",
      "process": "AI-generated from conversational emergence with human — compiled from eleven parallel Explore-agent deep reads (six initial, five targeted follow-ups) covering every actively-used file in the repo at the line level"
    },
    "human": {
      "author": "MDS",
      "intent": "Create a durable, exhaustive, posterity-grade map of the Color Shift codebase so any future session (human or AI) can load the complete mental model from a single file instead of re-reading the entire repo. No stone unturned. Every function, every prop, every ref, every animation, every fallback, every gotcha.",
      "context": "Color Shift is a Next.js 16 / React 19 / Tailwind v4 single-page color contrast tool. Desktop has been shipped for some time. A full mobile layout was recently built in a separate render path. User uploads, drag-and-drop, dynamic theme-color meta, container queries, synchronized slider/color animation, and wraparound photo navigation were added in the session that produced this map.",
      "style": "Terse, direct, reads code before writing it. Expects AI to prove understanding before acting. Prefers concrete with named files and exact line numbers over abstract descriptions."
    },
    "ai": {
      "model": "Claude Opus 4.6 (1M context)",
      "role": "Dispatch teams of Explore agents in parallel, one per domain. Synthesize findings into a single unified map. Preserve file paths, line numbers, and code snippets so future reads can trust the map without re-verifying. Spawn follow-up agents to fill any gap rather than leaving handwaved sections."
    },
    "requirements": {
      "SCOPE": {
        "COVERED": "Every actively-used file. Line-level detail on color-shift.tsx, strip-transition.tsx, control-container.tsx, controls-bar.tsx, color-engine.ts, color-slider.tsx, tube-text.tsx. Every primitive in src/components/ui/. control-strip.tsx (a whole component the map previously missed). dialkit-wrapper.tsx, agentation-wrapper.tsx, dev-tools.tsx, gsap-config.ts, fonts.ts. API routes. globals.css, layout.tsx, next.config.ts, package.json. Every motion param, every CSS var, every dangling reference. Keyboard shortcuts. Specimen input flow. Drag-drop. Photo transitions. The full GSAP Flip state machine. Every known fragility.",
        "NOT_COVERED": "Third-party library internals (culori, apca-w3, node-vibrant, dialkit, interface-kit, agentation). Test suite (none exists)."
      },
      "DO_NOT_BLINDLY_TRUST": {
        "DRIFT_RISK": "This map reflects the state on 2026-04-08. If it mentions a specific symbol, file path, or behavior, verify against the live code before recommending changes. Memories decay; the code is truth.",
        "CONTROLS_BAR_FRAGILITY": "controls-bar.tsx has a GSAP Flip orchestration that depends on React re-render style-clearing behavior. It also still contains a full mobile render branch (lines 231–275) that overlaps with the new mobile path in control-container.tsx. Touch with care."
      },
      "HOW_TO_USE": {
        "LOAD_INTO_CONTEXT": "Cat this file into any fresh session before making non-trivial changes. It is designed to give an AI collaborator the same working mental model the author built across multiple hours of parallel deep reads.",
        "UPDATE_ON_BIG_CHANGES": "If you restructure the state machine, swap primitives, change the photo pipeline, re-enable DialKit, or remove the motion package, update the relevant section so the next session doesn't relearn the same ground."
      }
    }
  }
  </json>
  <md>
    # Color Shift — Exhaustive Project Map

    Canonical reference for the Color Shift codebase: architecture, every state atom, every color math function, animation plumbing, mobile vs desktop split, every primitive, every known fragility. Compiled from eleven parallel deep-read agents on 2026-04-08.

    ## Quick Start
    1. Read the whole file once before making non-trivial changes.
    2. For any symbol, path, or line number referenced here, spot-check it against the live code before recommending edits — maps drift.
    3. When you change something architectural (state machine, slider system, photo pipeline, mobile layout, DialKit, primitives), update the relevant section so the next session doesn't relearn the same ground.

    ## Table of Contents
    1. Top-Level Architecture
    2. Build Infra, Layout, Globals, Safari Chrome
    3. `color-shift.tsx` — The Brain (state, refs, effects, handlers, keyboard, specimen flow)
    4. Photo Pipeline (API, buffer, extraction, uploads, object URLs)
    5. Color Math Stack (`color-engine.ts` — every function)
    6. Slider System (three-layer abstraction, drag flow, mode-switch flow)
    7. `ControlContainer` — Mobile vs Desktop render paths
    8. `StripTransition` — color panel, photo panel, drag-drop, credit slot
    9. UI Primitives (every file in `src/components/ui/`)
    10. `control-strip.tsx` — the parallel component the map previously missed
    11. `controls-bar.tsx` — the GSAP Flip state machine, line by line
    12. DialKit + Motion plumbing (`useDialKit`, `window.__motion`, CSS vars)
    13. GSAP configuration (`gsap-config.ts`)
    14. Fonts (`fonts.ts`)
    15. Public assets
    16. Known Gaps / Risks / Fragilities
    17. File Index

    ---

    ## 1. Top-Level Architecture

    - **Entry**: `src/app/page.tsx` renders `<ColorShift />`.
    - **Brain**: `src/components/color-shift.tsx` (**665 lines**) owns all state, orchestration, photo pipeline, color math plumbing, keyboard shortcuts, DialKit motion mirror.
    - **Rendering children**:
      - `StripTransition` — color panel (Aa / circle) + photo panel. GSAP for all transitions. Holds drag-and-drop + file picker.
      - `ControlContainer` — the dock. Two completely isolated render paths: desktop (`sm:`) uses the original `ControlsBar`; mobile (`<sm`) uses a custom YPanel-based path.
    - **Primitives**: every file in `src/components/ui/`. Re-exported from `src/components/ui/index.ts`.
    - **Dead legacy file**: `src/components/control-strip.tsx` — a 1012-line component with SliderPanel/ScorePanel/OklchSliders/HsbSliders/SliderRow sub-components and 9 internal icons. Imported at `color-shift.tsx:29` but **never rendered in any JSX** (grep-verified). The only live export actually used is the `PhotoData` type. See §10.
    - **Math**: `src/lib/color-engine.ts`.
    - **Fonts**: `src/lib/fonts.ts`.
    - **GSAP setup**: `src/lib/gsap-config.ts`.
    - **API**: `src/app/api/photos/route.ts` — server-side Unsplash proxy.

    **Stack**: Next.js 16.2.1 App Router, React 19.2.4, Tailwind v4 (inline `@theme` in globals.css), TypeScript strict, pnpm. GSAP 3.14.2 + `@gsap/react` 2.1.2, `motion` 12.38.0 (**ZERO imports — safe to remove**), `culori` 4.0.2, `apca-w3` 0.1.9, `node-vibrant` 4.0.4, `opentype.js` 1.3.4, `dialkit` 1.1.0, `interface-kit` 0.1.3.

    ---

    ## 2. Build Infra, Layout, Globals, Safari Chrome

    ### `next.config.ts`
    - `allowedDevOrigins: ['192.168.86.41']` — hardcoded LAN IP for mobile dev testing.
    - `images.remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]`.

    ### `tsconfig.json`
    - `target: ES2017`, `moduleResolution: 'bundler'`, `jsx: 'react-jsx'`.
    - Path alias: `"@/*": ["./src/*"]`.

    ### `src/app/layout.tsx`
    - Metadata: title "Color Shift", description.
    - `export const viewport` with `viewportFit: 'cover'`, `width: 'device-width'`, `initialScale: 1` — mandatory for iOS Safari to sample page pixels into top/bottom chrome.
    - Seven font variables injected on `<html>`:
      - `--font-geist-sans` (Google Geist)
      - `--font-geist-mono` (Google Geist Mono)
      - `--font-alpha-lyrae` (local `AlphaLyrae-Medium.woff2`)
      - `--font-departure-mono` (local `DepartureMono-Regular.woff2`)
      - `--font-instrument-serif` (Google Instrument Serif, weight 400)
      - `--font-ghost-byte` (local `GhostByte-Regular.woff`)
      - `--font-input-mono` (local `InputMono-Regular.woff2` 400 + `InputMono-Medium.woff2` 500)
    - All fonts use `display: 'swap'`.
    - Head: preconnect to `fonts.googleapis.com` + `fonts.gstatic.com`, inline `<link rel="stylesheet" href={getGoogleFontsUrl()}>` (specimen fonts).
    - Initial `<meta name="theme-color" content="#000000" />` — dynamically replaced at runtime on every `bgHex` change (see §3 effect 2).
    - Body: `{children}`, `<DevTools />` (null-returning stub), `// <AgentationWrapper />`, `// <DialKitWrapper />` — both commented out.

    ### `src/app/page.tsx`
    Minimal: renders `<ColorShift />` only.

    ### `src/app/globals.css`
    - `@import "tailwindcss"` + inline `@theme` with:
      - `--font-sans: var(--font-geist-sans)`
      - `--font-mono: var(--font-input-mono)`
      - `--font-specimen: var(--font-departure-mono)`
    - Motion CSS variables (lines 5–16): `--color-duration: 0.4`, `--photo-duration: 0.6`, `--photo-opacity: 0.3`, `--squish-scale: 0.85`, `--squish-duration: 0.15`, `--pop-scale: 1.05`, `--pop-duration: 0.1`, `--exit-duration: 0.25`, `--enter-duration: 0.35`, `--enter-overshoot: 1.4`.
    - `html, body { height: 100%; margin: 0; overflow: hidden; -webkit-font-smoothing: antialiased }`.
    - `html { background: #000 }` — dark surface for iOS Safari bottom tab bar translucent blur.
    - Universal button press effect (lines 45–78): `button:not(.no-press) { transition: transform 0.2s cubic-bezier(0.23,1,0.32,1) }`, `:active { transform: scale(0.95) }`, `@keyframes button-pop` on release. Respects `prefers-reduced-motion`. Excluded via `.no-press` class.
    - Slider styling (lines 82–119): hides native `::-webkit-slider-thumb` / `::-moz-range-thumb` and track. Track 6px tall, radius 3px. Thumb 24×24 transparent (custom grip rendered in React).
    - Specimen input (lines 123–129): placeholder at 30% opacity, selection white/20.
    - Spinner keyframe, reduced-motion blanket disable (lines 133–152).

    ### Mobile Safari theme-color (critical)
    `color-shift.tsx` effect at lines 143–151 removes every existing `meta[name="theme-color"]` and appends a fresh one on every `bgHex` change. Safari **ignores `setAttribute` updates** on existing theme-color metas — remove-and-reappend is mandatory.

    ```js
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', bgHex);
    document.head.appendChild(meta);
    ```

    Top chrome samples `theme-color`. Bottom chrome is translucent and blurs whatever pixels sit behind it — `html { background: #000 }` + the black mobile dock guarantees dark tinting there.

    ---

    ## 3. `color-shift.tsx` — The Brain

    ### State atoms (lines 91–114)
    UI:
    - `colorFormat` — 'HEX'|'RGB'|'HSL'|'HSB'|'OKLCH'
    - `theme` — toggled by `toggleTheme()` (T key)
    - `sliderMode` — 'OKLCH'|'HSB'|'RGB' (line 93)
    - `contrastAlgorithm` — 'WCAG2'|'APCA'
    - `controlsState` — 'default'|'score'|'export' (drives ControlsBar state machine + mobile YPanel open states)
    - `slidersExpanded` — boolean
    - `sliderTarget` — 'bg'|'fg'

    Photo:
    - `photoBuffer` — PhotoData[]
    - `photoIndex` — number
    - `isPhotoLoading` — boolean
    - `transitionDirection` — 'left'|'right'
    - `colorMap` — `Map<id, PhotoColors>` cached Vibrant extractions

    Color:
    - `manualColors` — `PhotoColors | null`, user override that supersedes extracted
    - `lighterAsBg` — polarity preference

    Slider:
    - `sliderPos` — `[number, number, number]` normalized 0–100 per channel, **independent of color space** (line 467)

    ### Refs
    - `isFetchingMore` (line 103), `hasInitialLoad` (line 104) — race guards.
    - `prevIndexRef` (line 108) — for direction computation.
    - `isDraggingRef` (line 154) — when true, slider sync uses instant positioning.
    - `sliderPosRef` (line 468), `sliderTweenRef` (line 469) — synchronous mirror of sliderPos and active GSAP tween.
    - `preloadedImages` (line 226) — Set of Image instances, LRU cap `MAX_PRELOADED = 20`, evicted via `img.src = ''`.
    - `photoIndexRef` (line 569) — closure-safe read in keyboard listener.
    - `prevSyncKey` (line 505) — memoization key for slider sync effect.
    - `rootRef`, `stripRef`, `specimenInputRef` (line 225).

    ### `applyPolarity` function (lines 76–83)
    ```ts
    function applyPolarity(pair: PhotoColors, lighterAsBg: boolean): PhotoColors {
      const bgIsDark = isHexDark(pair.bg, 128);
      const fgIsDark = isHexDark(pair.fg, 128);
      if (lighterAsBg && bgIsDark && !fgIsDark) return { bg: pair.fg, fg: pair.bg };
      if (!lighterAsBg && !bgIsDark && fgIsDark) return { bg: pair.fg, fg: pair.bg };
      return pair;
    }
    ```
    Only flips when the current arrangement disagrees with the preference AND one color is dark and the other isn't. Returns the pair unchanged when both are similarly toned. **This is why the original `swap()` failed on uploads** where extraction produced two similar colors.

    ### `getColorsForPhoto` (lines 118–124)
    ```ts
    const getColorsForPhoto = useCallback((photo: PhotoData | null): PhotoColors => {
      if (!photo) return { bg: '#000000', fg: '#000000' };
      const cached = colorMap.get(photo.id);
      if (cached) return cached;
      const safeFg = bumpToThreshold(photo.color, '#FFFFFF', 4.5, 'WCAG2');
      return { bg: photo.color, fg: safeFg };
    }, [colorMap]);
    ```
    Fallback (when not in colorMap): uses `photo.color` as bg, bumps white as fg to guarantee 4.5 WCAG against bg.

    ### Derived values
    - `photoData = photoBuffer[photoIndex] ?? null`
    - `colors = applyPolarity(manualColors ?? getColorsForPhoto(photoData), lighterAsBg)` (line 128)
    - `bgHex = colors.bg`, `fgHex = colors.fg`
    - `bg = hexToColorData(bgHex)`, `fg = hexToColorData(fgHex)`
    - `contrast = getContrastResult(bgHex, fgHex, contrastAlgorithm)`
    - `activeThreshold` — from contrast.score vs thresholds
    - `currentFont = getFontForPhoto(photoData.id)` (line 135)
    - `sliderConfigs` (lines 524–566, useMemo) — heavily memoized to avoid recomputing 21+ hex conversions per render. Deps: `sliderPos`, `sliderMode`, `sliderTarget`, `bg`, `fg`. Builds three gradient strings per slider per mode — see §6.

    ### `useDialKit` hook call (lines 175–202)
    Full parameter signature (format: `[default, min, max, step]`):
    ```ts
    const motionParams = useDialKit('Motion', {
      'color hover': {
        scale: [1.05, 1, 1.5, 0.01],
        duration: [1, 0, 1, 0.01],
        ease: { type: 'select', options: easeOptions, default: 'power4.out' },
        navPulseScale: [1.01, 1, 1.5, 0.01],
        navPulseDuration: [0.4, 0, 1, 0.01],
      },
      'color click': {
        duration: [0.3, 0, 1, 0.01],
        ease: { type: 'select', options: easeOptions, default: 'power4.out' },
      },
      'photo transition': {
        style: { type: 'select', options: ['fade','zoom-in','zoom-out','blur','pixelate','slide','scale-fade'], default: 'fade' },
        startOpacity: [0, 0, 1, 0.01],
        startScale: [1.05, 0.5, 1.5, 0.01],
        duration: [1, 0, 2, 0.01],
        ease: { type: 'select', options: easeOptions, default: 'power4.out' },
      },
      'control bar': {
        duration: [0.3, 0, 1, 0.01],
        ease: { type: 'select', options: easeOptions, default: 'power4.out' },
      },
    });
    ```

    `easeOptions` enum: `['power1.out', 'power2.out', 'power3.out', 'power4.out', 'sine.out', 'expo.out', 'circ.out', 'back.out', 'elastic.out', 'bounce.out', 'linear']`.

    ### `EASE_TO_CB` mapping (lines 161–173)
    GSAP ease name → CSS cubic-bezier string, used to translate control-bar ease into `--cb-ease`:
    ```ts
    const EASE_TO_CB: Record<string, string> = {
      'power1.out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'power2.out': 'cubic-bezier(0.33, 1, 0.68, 1)',
      'power3.out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      'power4.out': 'cubic-bezier(0.07, 1, 0.33, 1)',
      'sine.out':   'cubic-bezier(0.39, 0.575, 0.565, 1)',
      'expo.out':   'cubic-bezier(0.19, 1, 0.22, 1)',
      'circ.out':   'cubic-bezier(0.075, 0.82, 0.165, 1)',
      'back.out':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      'linear':     'linear',
      'elastic.out':'cubic-bezier(0.5, 1.5, 0.5, 1)',
      'bounce.out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    };
    ```

    ### motionParams → window.__motion effect (lines 205–223)
    Dependencies: `[motionParams]` (exhaustive-deps disabled). Writes to `window.__motion`:
    ```ts
    (window as any).__motion = {
      hover:      { scale, duration, ease, navPulseScale, navPulseDuration },
      click:      { duration, ease },
      photo:      { style, startOpacity, startScale, duration, ease },
      controlBar: { duration, ease },
    };
    document.documentElement.style.setProperty('--cb-duration', `${controlBar.duration}s`);
    document.documentElement.style.setProperty('--cb-ease', EASE_TO_CB[controlBar.ease] ?? 'cubic-bezier(0.33, 1, 0.68, 1)');
    ```

    **Single write site** for `window.__motion`. Read sites: `strip-transition.tsx` (`getMotionParams()`), `controls-bar.tsx` (`getControlBarMotion()`). CSS var read sites: `control-container.tsx` inline transitions, `controls-bar.tsx` inline transitions.

    ### Effects list
    1. `useEffect(() => { setManualColors(null); }, [photoIndex])` (line 137) — clear manual overrides on photo change.
    2. Theme-color meta dynamic remove-and-reappend on `bgHex` change (lines 143–151).
    3. `useDialKit` return + mirror to `window.__motion` + CSS vars (lines 175–223).
    4. Initial `loadPhotos()` behind `hasInitialLoad` guard (lines 340–344).
    5. Slider sync effect (lines 504–521): builds `syncKey`, short-circuits if unchanged, branches on `isDraggingRef`:
       - If dragging or first sync → `setSlidersInstant(target)`.
       - Else → `animateSlidersTo(target)` (GSAP proxy tween, 0.2s power4.out — matches gradient crossfade).
    6. Unmount cleanup (lines 473–477): kill active slider tween, clear preloaded images.
    7. Keyboard event listener on window (lines 572–585).

    ### Keyboard shortcuts (lines 572–585)
    Exact handler (edited for brevity):
    ```ts
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && target !== specimenInputRef.current) return;
      const idx = photoIndexRef.current;
      if (e.key === 'ArrowRight') { e.preventDefault(); navigateTo(idx + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); navigateTo(idx - 1); }
      if (e.code === 'Space' && target !== specimenInputRef.current) { e.preventDefault(); injectPhoto(); }
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) { e.preventDefault(); swap(); }
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) { e.preventDefault(); toggleTheme(); }
    };
    ```

    | Key | Action |
    |-----|--------|
    | `ArrowRight` | `navigateTo(idx + 1)` — wraps |
    | `ArrowLeft`  | `navigateTo(idx - 1)` — wraps |
    | `Space`      | `injectPhoto()` — fetches 1 new photo |
    | `S` / `s`    | `swap()` — directly flips manualColors + toggles lighterAsBg |
    | `T` / `t`    | `toggleTheme()` |

    Input-blur detection: any non-specimen `<input>` focus blocks all shortcuts. Space/S/T explicitly carve out the `specimenInputRef` exception.

    ### `specimenInputRef` flow — **DEAD CODE (verified 2026-04-08)**
    Defined at line 225: `const specimenInputRef = useRef<HTMLInputElement>(null)`. Used only as a guard in the keyboard handler (lines 575, 579–581) — `target !== specimenInputRef.current` to let the user type `s` / `t` / Space into the specimen input without triggering swap / theme / inject-photo.

    **But the ref is never attached to any `<input>` element** — grep-verified across `src/`. No `ref={specimenInputRef}` exists anywhere. The ref is permanently `null`, which means the keyboard carve-outs never actually fire (the check `target !== null` is trivially true for any real event target).

    The 20-font `SPECIMEN_FONTS` list + `getFontForPhoto` are still live (via `currentFont = getFontForPhoto(photoData.id)`), but the specimen *input field* where the user would type their own specimen text no longer renders anywhere. The most likely live-code consumer was the legacy `<ControlStrip />` component (lines 598–619 of `control-strip.tsx`, which *does* render a specimen `<input>`), but that component is never mounted either. Both are dead together.

    **Action**: either delete `specimenInputRef` + its keyboard carve-outs entirely, or wire it to a real input if you want the feature back.

    ### Handlers passed to `ControlContainer` (lines 606–662)
    - `slidersExpanded`, `sliderMode`, `sliders={sliderConfigs}`
    - Color states: `bgHex`, `fgHex`, `bgState`, `fgState`
    - Contrast: `algorithm`, `rating`, `contrastValue`, `thresholds`, `activeThreshold`
    - State: `controlsState`, `swapSelected={lighterAsBg}` (line 647)
    - `thresholds={contrastAlgorithm === 'WCAG2' ? [1.5, 3, 4.5, 7] : [30, 45, 60, 75, 90]}` (line 633)
    - `onBgClick`, `onFgClick` — expand sliders + switch target, or collapse if same target
    - `onSwap` — calls `swap()` (which writes `manualColors = { bg: fgHex, fg: bgHex }` + toggles `lighterAsBg`), also flips `sliderTarget` if sliders are open
    - `onResultsToggle`, `onAlgorithmToggle`, `onThresholdSelect` → `bumpTo()` via `bumpToThreshold`
    - `onLeftArrow`, `onRightArrow` → `navigateTo` (wraps)
    - `onSliderChange`, `onSliderDragStart/End`, `onSliderModeChange`, `onSlidersClose`, `onGripClick`
    - `onExportToggle`
    - `onCopyUrl` → `copyShareUrl()` → writes a deep link with `photo`, `bg`, `fg`, and `algo` query params.
    - `onCopyParams` → `copyParameters()` → writes only the deep-link query string.
    - `onDownloadMd` → `downloadMarkdown()` → downloads `generateExportMarkdown(...)` as a `.md` file with contrast data, share URL, and photo credit.

    ### Handlers passed to `StripTransition` (lines 565–571)
    - `ref={stripRef}`, `photo={photoData}`, `bgHex`, `fgHex`
    - `onPhotoFileSelected={injectPhotoFromFile}`

    ### `animateSlidersTo` helper (lines 480–493)
    GSAP proxy tween. Duration default 0.2s (changed from 0.3 to match gradient crossfade). Ease `power4.out`. Kills any existing `sliderTweenRef` before creating a new one. On each frame `onUpdate`, writes `sliderPosRef.current` and calls `setSliderPos(pos)`.

    ### `setSlidersInstant` (lines 496–500)
    Kills tween, sets both `sliderPosRef` and state to target immediately. Used during drag and first-sync.

    ### `injectPhoto` vs `injectPhotoFromFile`
    - **`injectPhoto`** (lines 361–376, async): `fetchPhotos(1)` → preloadThumbs → preloadImages → extractBatchColors → splice at `photoIndex + 1` → setPhotoIndex.
    - **`injectPhotoFromFile`** (lines 379–401, sync): `URL.createObjectURL(file)` → synthesizes PhotoData with `id: 'upload-${Date.now()}-${filename}'`, `url/thumbUrl/tinyUrl` all pointing to the same object URL, `color: '#000000'`, `photographer: 'You'`, `photographerUrl/photoUrl: '#'`, `alt: file.name` → `preloadImages([newPhoto])` → `extractBatchColors([newPhoto])` → splice + navigate. **No `preloadThumbs` call** (unlike `injectPhoto`). **Object URLs never revoked** — session-scoped memory growth.

    ---

    ## 4. Photo Pipeline

    ### `/api/photos?count=N` and `/api/photos?id=<unsplashId>` (`src/app/api/photos/route.ts`)
    - GET handler, count clamped 1–30.
    - Calls Unsplash `/photos/random?orientation=landscape&query=${term}` with `Authorization: Client-ID ${UNSPLASH_ACCESS_KEY}`.
    - `cache: 'no-store'` — every request hits upstream.
    - Query term picked from a shuffled 43-item pool (nature, architecture, texture, neon, etc.) to force diversity. Parallel fetches use different terms.
    - Response mapped to `PhotoData` with `tinyUrl` constructed from `urls.raw + ?w=32&q=50`.

    ### `PhotoData` shape (defined in `src/components/control-strip.tsx` lines 18–28)
    ```ts
    interface PhotoData {
      id: string;              // Unsplash id OR 'upload-${Date.now()}-${filename}'
      url: string;             // Full-size image URL
      thumbUrl: string;        // Unsplash thumb (~150px) OR same object URL
      tinyUrl: string;         // 32×32 blurry placeholder
      color: string;           // Hex from Unsplash metadata OR '#000000'
      photographer: string;    // User name OR 'You'
      photographerUrl: string; // Unsplash user link OR '#'
      photoUrl: string;        // Unsplash permalink OR '#'
      alt: string;             // alt_description OR filename
    }
    ```

    ### Buffer lifecycle
    - Initial `loadPhotos()`: fetch 10, preload thumbs for all, full images for first 3, batch-extract colors in groups of 5.
    - `navigateTo(newIndex)`: `((newIndex % len) + len) % len` modulo wraparound, sets direction, calls `maybeRefill`, preloads next 2 full images.
    - `maybeRefill(currentIdx, buffer)`: when remaining buffer ≤ 3, fetches 10 more, dedupes via `dedupePhotos` against existing ids, preloads, batch-extracts. Debounced via `isFetchingMore`.
    - `preloadImages` / `preloadThumbs`: `new Image()` constructor (not `<link rel="preload">`), sets `.src`, tracked in `preloadedImages` Set. LRU eviction at 20: oldest gets `img.src = ''` and removed from Set. Unmount cleans all.

    ### Color extraction (`extractColorsFromPhoto`, lines 264–286)
    - Lazy imports `node-vibrant/browser` — runs client-side.
    - `await Vibrant.from(img).getPalette()` → 6 swatches (Vibrant, DarkVibrant, LightVibrant, Muted, DarkMuted, LightMuted).
    - Maps to `VibrantPalette`, calls `extractContrastPair(palette, 'WCAG2')` (see §5).
    - Returns `null` on image load failure.

    ### Batch extraction (`extractBatchColors`, lines 288–304)
    Dedupes against `colorMap`, batches in groups of 5, awaits all extractions, writes to `colorMap` only if new entries exist.

    ### Upload flow (`injectPhotoFromFile`) — see §3.

    **Object URL revocation: NONE**. Uploaded photos accumulate blob URLs for the session lifetime. Acceptable for single-session tool, not for long-lived apps.

    ---

    ## 5. Color Math Stack (`src/lib/color-engine.ts`)

    ### Types (lines 6–30)
    - `ColorFormat = 'HEX' | 'RGB' | 'HSL' | 'HSB' | 'OKLCH'`
    - `SliderMode = 'HSB' | 'OKLCH' | 'RGB'`
    - `ContrastAlgorithm = 'WCAG2' | 'APCA'`
    - `Grade = 'AAA' | 'AA' | 'AA Large' | 'Fail' | 'Body ✓' | 'Content' | 'Headlines' | 'Spot' | 'Min'`
    - `HSB { h: 0–360, s: 0–100, b: 0–100 }`
    - `OklchValues { l: 0–100, c: 0–0.4, h: 0–360 }`
    - `ColorData { hex, rgb: {r,g,b 0–255}, hsl: {h 0–360, s 0–100, l 0–100}, hsb: HSB, oklch: {l 0–100, c 0–0.4, h 0–360} }` — **FIVE format reps**, not three.

    ### Types (lines 212–217, 436–448)
    - `ContrastResult { score, scoreLabel, grade, gradeDesc }`
    - `VibrantSwatch { hex, population }`
    - `VibrantPalette { Vibrant?, DarkVibrant?, LightVibrant?, Muted?, DarkMuted?, LightMuted? }` — six optional swatches.

    ### Constants
    - `WCAG_THRESHOLDS = [1.5, 3.0, 4.5, 7.0]` (line 307)
    - `APCA_THRESHOLDS = [30, 45, 60, 75, 90]` (line 308)

    ### Internal culori converters (lines 34–37)
    `toOklch = converter('oklch')`, `toHsv`, `toRgb`, `toHsl` — reused throughout.

    ### `hexToColorData(hex)` (lines 41–75)
    1. `culori.parse(hex)` → falls back to `hexToColorData('#000000')` on null (safety recursion).
    2. Convert to RGB, HSL, HSV, OKLCH.
    3. Normalize: RGB `× 255` rounded; HSL `s,l × 100` rounded; HSB uses HSV `v` as brightness, `s,v × 100` rounded.
    4. OKLCH precision split: **L scaled by 100 to `.toFixed(1)`, C to `.toFixed(3)`, H rounded**.

    ### `hsbToHex(hsb)` (lines 79–82), `oklchToHex(oklch)` (lines 86–89), `rgbToHex(r,g,b)` (lines 93–96)
    All normalize per culori's expected 0–1 ranges and call `formatHex()` with fallback to `'#000000'`.

    ### `maxChroma(l, h)` (lines 103–141) + `maxChromaCache` (line 101)
    - Cache key: `` `${l.toFixed(1)},${Math.round(h)}` `` — quantized to 0.1 L / 1° H.
    - Binary search, range `[0, 0.4]` chroma, **30 iterations**.
    - Convergence: formatHex the OKLCH color, parse back, if diff < `0.005` chroma → update `best` and move `lo` up. If formatHex returns null or diff too large → `hi = mid`.
    - Result stored in cache quantized to 3 decimals.
    - Used by `colorToPercent` / `percentToActual` to gamut-normalize OKLCH chroma sliders.

    ### Luminance helpers
    - `isHexDark(hex, threshold = 128)` (lines 145–151) — **BT.601 video luma**: `(r*299 + g*587 + b*114) / 1000 < threshold`. Fast, rougher than WCAG perceptual luminance, sufficient for UI dark/light detection.
    - `linearize(c)` (lines 155–157) — WCAG sRGB gamma curve: `c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`.
    - `relativeLuminance(hex)` (lines 159–164) — linearize each channel, weight `0.2126R + 0.7152G + 0.0722B` (CIE BT.709 primaries).

    ### WCAG contrast
    - `wcagContrastRatio(hex1, hex2)` (lines 166–172) — `(max+0.05)/(min+0.05)`, rounded 2dp.
    - `wcagGrade(ratio)` (lines 174–179) — `≥7 → 'AAA'`, `≥4.5 → 'AA'`, `≥3 → 'AA Large'`, else `'Fail'`.

    ### APCA contrast
    - `hexToRgbArray(hex)` (lines 183–192) — hex → `[r, g, b]` 0–255 tuple.
    - `apcaLc(fgHex, bgHex)` (lines 194–199) — `sRGBtoY([r,g,b])` for fg and bg → `APCAcontrast(fgY, bgY)` → `Math.abs()` rounded 1dp. **Param order is FG-first, opposite of WCAG**; absolute-value output makes it direction-agnostic for grading.
    - `apcaGrade(lc)` (lines 201–208):
      - `≥90 → 'Body ✓'`
      - `≥75 → 'Body ✓'` ⚠️ **duplicate grade** — both 90 and 75 return the same string. Possible bug or intentional (maybe different `gradeDesc` strings below differentiate).
      - `≥60 → 'Content'`
      - `≥45 → 'Headlines'`
      - `≥30 → 'Spot'`
      - else → `'Min'`

    ### Unified contrast API
    - `contrastRatio(bgHex, fgHex, algorithm = 'WCAG2')` (lines 219–222) — dispatches to `apcaLc(fgHex, bgHex)` or `wcagContrastRatio`.
    - `getContrastResult(bgHex, fgHex, algorithm)` (lines 224–244) — returns `{score, scoreLabel, grade, gradeDesc}`:
      - APCA: `scoreLabel = \`Lc ${lc}\``
      - WCAG: `scoreLabel = \`${ratio}:1\``
    - `gradeDescription(grade)` (lines 246–261) — switch mapping grade strings to English descriptions.

    ### Thresholds
    - `getThresholds(algorithm)` (lines 310–312)
    - `nearestThreshold(score, algorithm)` (lines 314–323) — linear search for smallest `|score - t|`.
    - `nextThresholdUp(score, algorithm)` (lines 325–328) — margin **0.05 WCAG / 1.0 APCA**, returns first `t > score + margin` or null.
    - `nextThresholdDown(score, algorithm)` (lines 330–333) — reverse array, first `t < score - margin` or null.

    ### `bumpToThreshold(bgHex, fgHex, targetScore, algorithm)` (lines 335–380)
    Binary search on **OKLCH lightness only**, preserves hue + chroma.
    1. Extract FG OKLCH.
    2. Detect `fgIsLighter = relativeLuminance(fg) >= relativeLuminance(bg)`.
    3. Tolerance: APCA 1.0 / WCAG 0.05.
    4. 50 iterations, range `lo=0, hi=1`:
       - Test hex at `mid` lightness (same C, H as original fg).
       - Score vs target.
       - Track best (closest to target), exit early if within tolerance.
       - Direction: if fg is lighter, `score < target` → need more light → `lo = mid`; `score >= target` → `hi = mid`. Inverse if fg is darker.
    5. Return best hex.

    ### `extractContrastPair(palette, algorithm = 'WCAG2')` (lines 450–507)
    Complex scoring pipeline for vibrant palettes:
    1. Flatten palette into `swatches[]` with role labels.
    2. Return null if < 2 swatches.
    3. Exhaustive pair search (`for a in swatches: for b in swatches`, skip `a === b`):
       - Skip pairs with `ratio < 3.0` (AA Large floor).
       - `vibrancy = (a.role.includes('Vibrant') ? 1.5 : 0) + (b.role.includes('Vibrant') ? 1.5 : 0)` — max +3.0.
       - `prominence = (a.population + b.population) / 100000` — capped via `Math.min(prominence, 2)`.
       - `score = ratio + vibrancy + Math.min(prominence, 2)`.
       - If new best, assign darker-of-pair as `bg`, lighter as `fg`.
    4. Fallback if no pair ≥ 3.0: sort swatches by `relativeLuminance`, use darkest as bg, lightest as fg.
    5. AA guarantee: `bumpToThreshold(bg, fg, algo === 'APCA' ? 60 : 4.5, algo)` on the chosen fg. Returns `{ bg, fg: safeFg }`.

    ### `parseAnyColor(input)` (lines 512–529)
    1. Try HSB regex `/hsb\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i` → `hsbToHex` if match.
    2. Else trim, auto-prepend `#` to 3–8-char hex-like strings, `culori.parse()` → `formatHex()` or null.

    ### `generateRandomPair()` (lines 267–303) — **OKLCH-based harmony generator**
    - Picks random harmony from `['complementary', 'analogous', 'triadic', 'split-complementary', 'random']`.
    - Base hue 0–360.
    - FG hue offset by harmony rule (complementary: +180±10, analogous: +30..60, triadic: +120±10, split-comp: +150..210).
    - BG lightness: 50% chance dark (0.1–0.4), 50% light (0.7–0.95). FG lightness inverse.
    - BG chroma 0.02–0.17, FG chroma 0.05–0.25.
    - Format both via `oklchToHex`, fallback to hardcoded `#1A1A2E` / `#E8D5B7`.
    - **Not currently called anywhere** — but exported, so may be wired into future random-color feature.

    ### `formatColorValue(data, format)` (lines 384–393)
    Switch on format. **Outputs**:
    - HEX → uppercase hex
    - RGB → `"r, g, b"` (bare, no `rgb()` wrapper)
    - HSL → `"h°, s%, l%"`
    - HSB → `"h°, s%, b%"`
    - OKLCH → `"l% c h°"`

    ### `generateExportMarkdown(bg, fg, contrast, algorithm, photoCredit?, shareUrl?)` (lines 397–432)
    Output shape:
    ```md
    # Color Shift Export

    ## Background
    - HEX: #XXXXXX
    - RGB: rgb(r, g, b)
    - HSL: hsl(h, s%, l%)
    - HSB: hsb(h, s%, b%)
    - OKLCH: oklch(l% c h)

    ## Foreground
    [same five lines]

    ## Contrast (WCAG2 | APCA)
    - Score: [4.50:1 or Lc 72.3]
    - Grade: [grade]
    - [gradeDesc]

    ## Photo Credit
    - Photographer: [name]
    - Photo: [URL]
    ```
    Photo credit section only rendered if `photoCredit` provided.

    ---

    ## 6. Slider System

    ### Three-layer abstraction
    1. **Normalized percent** (`sliderPos` state) — `[0..100, 0..100, 0..100]`, **color-space agnostic**, persisted in state.
    2. **Actual values** — L/C/H, H/S/B, R/G/B — computed on demand via `percentToActual` (in `color-shift.tsx`, not the engine lib).
    3. **Hex** — canonical truth.

    ### Percent ↔ actual (inside `color-shift.tsx`, lines 40–73)
    - `colorToPercent(ColorData, mode)`:
      - OKLCH: L passthrough, C `(c / maxChroma(l, h)) * 100` (gamut-normalized), H `(h / 360) * 100`.
      - HSB/RGB: linear range map.
    - `percentToActual(pct, mode, cd)` — reverse, recomputing `maxChroma` so C scales to the current gamut boundary.
    - `actualToHex(values, mode)` — dispatches to `oklchToHex` / `hsbToHex` / `rgbToHex`.

    ### OKLCH gamut quirk
    Because C is gamut-normalized, absolute chroma at `C_pct = 50` changes as L changes. When the user drags L, the C slider position *drifts visually* to stay at the same normalized percentage. Intentional — keeps OKLCH editing inside sRGB naturally.

    ### `sliderConfigs` useMemo (lines 524–566)
    Builds three gradient strings per slider (one per mode). Each slider gets `{oklch, hsb, rgb}` gradients. Example OKLCH gradients (L/C/H):
    - L slider: `linear-gradient(90deg, oklchToHex({l:0, c:oV[1], h:oV[2]}), ..., oklchToHex({l:100, ...}))`
    - C slider: `linear-gradient(90deg, oklchToHex({l:oV[0], c:0, h:oV[2]}), oklchToHex({l:oV[0], c:oMc, h:oV[2]}))` where `oMc = Math.max(maxChroma(...), oV[1], 0.001)`.
    - H slider: hue sweep 0..360 at constant L, C.

    Same pattern for HSB and RGB. 21+ hex conversions per frame — hence the memo.

    ### Drag flow
    `onSliderChange(i, v)` → kill tween → `setSlidersInstant(newPos)` → `percentToActual(newPos, mode, cd)` → `actualToHex(values, mode)` → `setManualBg/Fg(newHex)` → colors memo recomputes → sync effect short-circuits on `isDraggingRef === true`.

    ### Mode-switch flow
    `sliderMode` changes → sync effect rebuilds target percentages for the same hex in the new mode → `animateSlidersTo(target, 0.2)` GSAP proxy tween with `power4.out`. Grip position is driven by `sliderPos` state writes from the tween's `onUpdate`, NOT by CSS `left` transitions. The CSS `left` transition on `color-slider.tsx` (200ms cubic-bezier(0.23,1,0.32,1)) only fires between discrete renders. Gradient opacity crossfade runs in parallel at the same duration/ease.

    ---

    ## 7. `ControlContainer` — Mobile vs Desktop

    Two completely isolated render paths via `hidden sm:flex` / `flex sm:hidden` wrappers. Zero shared JSX.

    ### Desktop path
    Unchanged original: `[slider-panel (grid-rows 0fr↔1fr), ControlsBar]`. ColorMode + ColorSliders inside the slider panel.

    ### Mobile path (`flex sm:hidden flex-col w-full overflow-visible px-6 pt-6 [&_*]:text-[16px]`)
    Inline `paddingBottom: calc(3rem + env(safe-area-inset-bottom))`.

    The `[&_*]:text-[16px]` descendant selector overrides every primitive's `text-xs` via specificity (0,1,1 > 0,1,0).

    Render order top → bottom:
    1. **Slider YPanel** — open when `mobileSlidersOpen = slidersExpanded && controlsState === 'default'`. Contains `ColorMode` (with `showClose`/`onClose` commented out) + `ColorSliders`.
    2. **Score YPanel** — open when `controlsState === 'score'`. Contains a vertical threshold stack. The wrapper is ref'd; a `useLayoutEffect` captures previous height and GSAP-tweens (0.25s power2.out) on `algorithm`/`thresholds` change, then releases to `height: auto`.
    3. **Export YPanel** — open when `controlsState === 'export'`. Three full-width `CSButton`s: COPY URL, COPY PARAMETERS, DOWNLOAD .MD. All are wired to live handlers.
    4. **Swatches YPanel** — open when `controlsState === 'default'`. `pt-4` **only when `mobileSlidersOpen`** (breathing room from sliders above). Inside: `CSButton(fg)` / `IconButton(swap)` / `CSButton(bg)` in `justify-between`.
    5. **Always-rendered Score+Export row** — not a YPanel itself, but Score is wrapped in a nested YPanel that collapses when `controlsState === 'export'`. The right-side button is a single `<button>` whose `TubeText` swaps between `EXPORT` and `WCAG` / `APCA` based on state, with click handler routing to `onExportToggle` or `onAlgorithmToggle`.
    6. **Always-rendered arrows row** — bare flex row with two `IconButton`s containing `LeftArrowIcon` / `RightArrowIcon` at `size-[30px]` (1.25× the primitive's default 24px).

    ### `YPanel` helper (defined locally at top of control-container.tsx)
    Grid-rows `0fr ↔ 1fr` on an outer wrapper + translateY `-8px → 0` + opacity on the inner, all driven by `var(--cb-duration, 0.2s)` and `var(--cb-ease, cubic-bezier(0.33,1,0.68,1))`. `pointer-events: none` when closed.

    ---

    ## 8. `StripTransition`

    ### Props interface (lines 26–31)
    ```ts
    interface StripTransitionProps {
      photo: PhotoData | null;
      bgHex: string;
      fgHex: string;
      onPhotoFileSelected?: (file: File) => void;
    }
    ```
    `forwardRef<HTMLDivElement, StripTransitionProps>`. External ref points at the root container (line 136: `<div ref={ref} className="relative w-full h-full overflow-hidden flex flex-col sm:flex-row">`). Display name `StripTransition` (line 278).

    ### Refs + state
    - `colorRef` (36), `textRef` (37), `circleRef` (38), `photoContainerRef` (39), `fileInputRef` (40)
    - `prevPhotoId` (42) — `useRef<string|null>(null)` for transition guard
    - `showText` (43) — `useState(true)` — drives Aa ↔ circle toggle
    - `isHoveringRef` (44) — `useRef(false)` — tracks hover without rerender
    - `isDraggingOver` (41) — `useState(false)` — drag visual feedback

    ### `getMotionParams()` helper (lines 16–24)
    ```ts
    function getMotionParams(): MotionParams {
      const fallback: MotionParams = {
        hover: { scale: 1.05, duration: 1, ease: 'power4.out', navPulseScale: 1.01, navPulseDuration: 0.4 },
        click: { duration: 0.3, ease: 'power4.out' },
        photo: { style: 'fade', startOpacity: 0, startScale: 1.05, duration: 1, ease: 'power4.out' },
      };
      if (typeof window === 'undefined') return fallback;
      return (window as any).__motion ?? fallback;
    }
    ```

    ### Color ease effect (lines 47–54)
    On `bgHex`/`fgHex` change: `gsap.to(colorRef.current, { backgroundColor: bgHex, duration: 0.4, ease: 'power2.out', overwrite: true })` and `gsap.to(textRef.current, { color: fgHex, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })`.

    ### Photo transition effect (lines 53–93)
    Deps: `[photo, showText]`.

    Guards (lines 54–63):
    - Exit if `!photo` or same id (via `prevPhotoId.current`).
    - Track `isFirstLoad = prevPhotoId.current === null`.
    - Exit if `!photoContainerRef.current`.

    Timing object `t` (line 66): `{ duration: p.duration, ease: p.ease, overwrite: true }`.

    **All 7 photo transition styles** (switch lines 64–80):

    | Style | `from` | `to` |
    |-------|--------|------|
    | `fade`, `zoom-in`, `zoom-out`, `scale-fade` | `{opacity: startOpacity, scale: startScale, filter: 'none', x: 0}` | `{opacity: 1, scale: 1, ...t}` |
    | `blur` | `{opacity: startOpacity, scale: startScale, filter: 'blur(20px)', x: 0}` | `{opacity: 1, scale: 1, filter: 'blur(0px)', ...t}` |
    | `pixelate` | `{opacity: startOpacity, scale: startScale, filter: 'contrast(1.5) blur(8px) saturate(1.3)', x: 0}` | `{opacity: 1, scale: 1, filter: 'contrast(1) blur(0px) saturate(1)', ...t}` |
    | `slide` | `{opacity: startOpacity, scale: startScale, filter: 'none', x: '30%'}` | `{opacity: 1, scale: 1, x: '0%', ...t}` |

    Note: fade/zoom-in/zoom-out/scale-fade share the same from/to — they differ only because `startOpacity` and `startScale` are tuned differently per style by DialKit. The style selector doesn't actually change the animation *mechanics*; the distinction lives in the params.

    Nav pulse (lines 86–96): skipped if `isFirstLoad` OR `isHoveringRef.current`. Otherwise selects `showText ? textRef : circleRef` and runs a GSAP timeline: `.to(active, {scale: navPulseScale, duration: navPulseDuration/2, ease: hover.ease}).to(active, {scale: 1, duration: navPulseDuration/2, ease: hover.ease})`.

    ### Interactive handlers
    - `handleEnter` (lines 99–105): `isHoveringRef = true`, scales active ref to `hover.scale`.
    - `handleLeave` (lines 107–113): `isHoveringRef = false`, scales back to 1.
    - `handleClick` (lines 115–133): Aa↔circle toggle. Outgoing element tweens `{scale: 0, opacity: 0}`. Incoming element `fromTo({scale: 0, opacity: 0}, {scale: incomingScale, opacity: 1})` where `incomingScale = isHoveringRef.current ? hover.scale : 1` (lands in hover state if mouse still over panel). Then `setShowText(!showText)`.

    ### Color panel (lines 138–166)
    - `colorRef` wraps all, className `w-full h-1/2 sm:w-1/2 sm:h-full flex items-center justify-center relative cursor-pointer select-none z-10`, inline style `{ backgroundColor: bgHex, containerType: 'size' }`. The `containerType: 'size'` enables `cqh` units.
    - `textRef` span, className `absolute text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] leading-[1] tracking-tight select-none`, style `{color: fgHex, fontFamily: "'Instrument Serif', serif"}`. Text: `"Aa"`.
    - `circleRef` div, initial inline `{opacity: 0, transform: 'scale(0)'}`. Contains `<svg viewBox="0 0 100 100" className="w-[50cqh] h-[50cqh] sm:w-[20vh] sm:h-[20vh]"><circle cx="50" cy="50" r="50" fill={fgHex} /></svg>`. **Mobile: 50cqh (50% of color panel height)**. Desktop: 20vh.

    ### Photo panel (lines 170–236)
    - Outer div: `className="w-full h-1/2 sm:w-1/2 sm:h-full relative overflow-hidden cursor-pointer"`.
    - `onClick → fileInputRef.current?.click()`.
    - `onDragEnter` (lines 173–178): checks `e.dataTransfer.types.includes('Files')`, preventDefault, `setIsDraggingOver(true)`.
    - `onDragOver` (lines 179–184): same check, `dropEffect = 'copy'`.
    - `onDragLeave` (lines 185–189): `if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDraggingOver(false)` — avoids flicker when crossing children.
    - `onDrop` (lines 190–197): extracts first `image/*` file, calls `onPhotoFileSelected?.(file)`.
    - Hidden file input (lines 200–210): `className="sr-only"`, `onChange` extracts file, calls callback, resets `e.target.value = ''`.
    - `photoContainerRef` (lines 215–236): inline style:
      ```js
      {
        transform: isDraggingOver ? 'scale(0.9)' : 'scale(1)',
        transformOrigin: 'center center',
        transition: 'transform 150ms cubic-bezier(0.33,1,0.68,1), outline-color 150ms linear',
        outline: '1px dashed rgba(255,255,255,0.6)',
        outlineOffset: '-1px',
        outlineColor: isDraggingOver ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0)',
      }
      ```
      Inside: `<img src={photo.tinyUrl} style={{imageRendering: 'pixelated'}} />` (pixelated placeholder) + `<img src={photo.url} />` (full-res).

    ### Credit slot — three persistent TubeText instances (lines 240–270)
    ```ts
    const isUpload = photo.id.startsWith('upload-');
    const state: 'credit' | 'filename' | 'drag' = isDraggingOver
      ? 'drag'
      : isUpload ? 'filename' : 'credit';
    ```
    Three TubeText divs, absolutely stacked (`absolute inset-0`), wrapped in `<div className="absolute bottom-3 left-4 right-3 z-10" onClick={(e) => e.stopPropagation()}>`:
    1. `<TubeText text={state === 'credit' ? \`Unsplash / ${photo.photographer}\` : ''} />`
    2. `<TubeText text={state === 'filename' ? photo.alt : ''} />`
    3. `<TubeText text={state === 'drag' ? 'DRAG AND DROP TO ADD PHOTO' : ''} />`

    Because each TubeText stays mounted, state transitions drive real → empty → real text changes per instance, firing their own char rotate-out / rotate-in animations cleanly without cross-string interpolation artifacts.

    ---

    ## 9. UI Primitives (`src/components/ui/`)

    ### `cs-button.tsx`
    **Props**: `label` (req), `state` (default|hover|selected), `swatchColor?`, `accentColor?`, `accentTextColor?`, `animated?`, `onClick?`, `className?`. No internal state. Renders optional `Swatch` child + either `TubeText` (when `animated`) or plain span. Selected state uses `accentColor` as bg with inset stroke.

    ### `swatch.tsx`
    **Props**: `color` (req), `className?`. 12×12 chip (`size-3`), `rounded-[2px]`. Inset shadow color flips between `rgba(255,255,255,0.1)` (dark colors) and `rgba(0,0,0,0.1)` (light) via `isHexDark`.

    ### `swatches.tsx`
    **Props**: `bgHex`, `fgHex`, `bgState?`, `fgState?`, `swapSelected?`, `onBgClick?`, `onFgClick?`, `onSwap?`, `className?`. Renders `[CSButton(fg)] [IconButton(swap)] [CSButton(bg)]` flex justify-between. Both buttons pass `animated={true}`.

    ### `icon-button.tsx`
    **Props**: `children` (icon SVG), `selected?`, `onClick?`, `className?`. forwardRef to `HTMLButtonElement`. Selected bg `#191919` with inset border.

    ### `icons.tsx`
    Exports: `LeftArrowIcon`, `RightArrowIcon`, `SwapArrowsIcon`. All accept `{className?: string}`. SVG `width=24 height=24 viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth="1.5"`.

    ### `arrows.tsx`
    **Props**: `onLeft?`, `onRight?`, `className?`. forwardRef to a handle type `ArrowsHandle { leftEl, rightEl, containerEl }`. Uses `useImperativeHandle` to expose internal `leftRef`, `rightRef`, `containerRef`. Consumer is `controls-bar.tsx` which GSAP-animates the individual buttons by ref.

    ### `grip.tsx`
    **Props**: `expanded`, `onClick?`, `className?`. Single button with centered dot. Dot animates 8px→24px, white→`rgba(255,255,255,0.2)`, over 300ms `cubic-bezier(0.23,1,0.32,1)`.

    ### `color-mode.tsx`
    **Props**: `mode`, `onModeChange?`, `showClose?`, `onClose?`, `className?`. OKLCH/HSB/RGB tabs + optional CLOSE button. Originally had `h-7` (28px) on the root which clipped at 16px mobile text — **we removed it**. Root class: `flex items-center justify-between ${className}`.

    ### `color-slider.tsx`
    **Props**: `label`, `value`, `min`, `max`, `step?=1`, `displayValue`, `gradients: {oklch, hsb, rgb}`, `activeMode`, `trackDark?`, `onChange?`, `onDragStart?`, `onDragEnd?`, `className?`.

    Internal state: `hovered`, `dragging` — both drive `expanded = hovered || dragging` which controls grip size/blur. `trackRef` for grip-proximity hover detection (pointer within 16px of grip x).

    Three gradient layers always rendered, opacity crossfaded via:
    ```
    transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]
    ```
    Grip container: `left: calc(4px + (100% - 8px) * ${pct/100})`, `transition: dragging ? 'none' : 'left 0.2s cubic-bezier(0.23,1,0.32,1)'`. Inner dot: `width/height` 10→24, `backgroundColor` white→`rgba(255,255,255,0.35)`, `backdropFilter` none→`blur(3px)`, `boxShadow` default→inset highlight + drop. 250ms ease.

    Invisible native `<input type="range">` overlay handles interaction. Mouse enter/leave clears hovered/dragging. Mouse down sets dragging + fires `onDragStart`. Mouse up clears dragging + fires `onDragEnd`.

    ### `color-sliders.tsx`
    Trivial wrapper: maps 3 `SliderConfig`s to `ColorSlider`s. Flex col, `gap-3 px-4 w-full overflow-visible`.

    ### `score.tsx`
    **Props**: `type` (wcag|apca), `state?` (default|hovered|selected), `rating`, `value`, `onClick?`, `className?`. Renders button with two `TubeText` instances: rating + value, gap-2.5. Selected: `bg-[#191919]` + `boxShadow: inset 0 0 0 1px #332f2f`. Text color `#e5e0e0` when selected, `#a39f9f` otherwise.

    ### `threshold-buttons.tsx`
    **Props**: `thresholds` (number[]), `activeThreshold?`, `algorithm`, `onSelect?`, `className?`. Renders horizontal row of `CSButton`s with `animated={true}`.

    ### `results.tsx`
    **Props**: `expanded`, `algorithm`, `rating`, `value`, `thresholds`, `activeThreshold?`, `onToggle?`, `onAlgorithmToggle?`, `onThresholdSelect?`, `className?`. Desktop-only. Collapsed = Score + algorithm label; expanded = ThresholdButtons + Score (selected).

    ### `export-panel.tsx`
    **Props**: `expanded`, `onToggle?`, `onCopyUrl?`, `onDownloadMd?`, `onExport?`, `className?`. Desktop-only. Collapsed = single EXPORT button; expanded = COPY URL + DOWNLOAD .MD + EXPORT (selected pill).

    ### `tube-text.tsx`
    **Props**: `text`, `className?`, `style?`. Single-span GSAP SplitText. On mount, sets text directly via `setRef` callback (no animation). On text change:
    1. `new SplitText(el, {type: 'chars'})` on current text.
    2. `gsap.set(container, {perspective: 300})`, `gsap.set(el, {transformStyle: 'preserve-3d'})`.
    3. Timeline: rotate current chars out (`rotationX: 90, autoAlpha: 0`, stagger 0.01s, duration 0.1s, `power2.in`).
    4. `.call(() => { splitOut.revert(); el.textContent = text; ... })`.
    5. Measure new width, if different, `gsap.fromTo(container, {width: currentWidth}, {width: newWidth, duration: 0.2, ease: 'power2.out', onComplete: () => gsap.set(container, {width: 'auto'})})`.
    6. New SplitText, rotate new chars in from `{rotationX: -90, autoAlpha: 0}` to `{rotationX: 0, autoAlpha: 1}`, stagger 0.01, duration 0.1, `power2.out`, `onComplete: () => splitIn.revert()`.

    Transform origin: `50% 50% ${depth}px` where `depth = -container.offsetWidth / 6`.

    ### `controls-bar.tsx`
    **Desktop-only orchestrator, ~360 lines, the most fragile file in the repo.** See §11 for full details.

    ### `index.ts`
    Re-exports: Swatch, CSButton, IconButton, Grip, LeftArrowIcon, RightArrowIcon, SwapArrowsIcon, Score, Swatches, Arrows, ThresholdButtons, ExportPanel, ColorMode, ColorSlider, Results, ColorSliders, ControlsBar.

    ---

    ## 10. `control-strip.tsx` — DEAD LEGACY COMPONENT

    **Lines**: **1012** (verified via `wc -l`). Defined in `src/components/control-strip.tsx`.

    **Exports**:
    - `PhotoData` interface (lines 18–28) — **the only live export actually consumed by the rest of the codebase.**
    - `ControlStripProps` interface (line 32).
    - `ControlStrip` component (line 235, named export).
    - Sub-components: `SliderPanel`, `ScorePanel`, `OklchSliders`, `HsbSliders`, `SliderRow`.
    - Icons: `ShuffleIcon`, `PhotoIcon`, `SwapIcon`, `ChevronUp`, `ChevronDown`, `CopyIcon`, `SunIcon`, `MoonIcon`, `SpinnerIcon`.

    **Props (ControlStripProps, ~21 total, lines 32–68)**: colors, contrast, theme, UI handlers, color format, slider mode, photo thumbnail, GSAP animation callbacks, format/download/copy operations.

    **Usage status — DEAD CODE (grep-verified)**:
    - `color-shift.tsx:29` imports both `PhotoData` and `ControlStrip`.
    - `strip-transition.tsx` imports `PhotoData`.
    - `_archive-strip-transition.tsx` imports `PhotoData`.
    - **Zero `<ControlStrip` JSX open tags anywhere in `src/`.** The component is imported but never mounted.

    Contents: GSAP panel expand/collapse at lines 553, 556–568, 570–578 (SliderPanel) and 708, 711–723, 725–733 (ScorePanel). Contains a live specimen `<input>` at lines 598–619 — the only place in the whole repo that actually renders a specimen text field. Since the parent `ControlStrip` is never rendered, this input doesn't mount either, which is why the `specimenInputRef` in `color-shift.tsx` is orphaned (see §3).

    **Action**: extract `PhotoData` to its own type file (e.g. `src/types/photo.ts`) and delete `control-strip.tsx` entirely. Removes ~1000 lines of dead code in one shot.

    ---

    ## 11. `controls-bar.tsx` — The GSAP Flip State Machine

    **Desktop-only (plus a vestigial mobile branch — see below)**. ~360 lines.

    ### Props (lines 39–63) — **23 total**, not 47
    | Line | Prop | Type |
    |------|------|------|
    | 40 | `state` | `'default' \| 'score' \| 'export'` |
    | 41 | `bgHex` | `string` |
    | 42 | `fgHex` | `string` |
    | 43 | `bgState?` | `'default' \| 'hover' \| 'selected'` |
    | 44 | `fgState?` | same |
    | 45 | `algorithm` | `'wcag' \| 'apca'` |
    | 46 | `rating` | `string` |
    | 47 | `contrastValue` | `string` |
    | 48 | `thresholds` | `number[]` |
    | 49 | `activeThreshold?` | `number` |
    | 50 | `onBgClick?` | `() => void` |
    | 51 | `onFgClick?` | `() => void` |
    | 52 | `onSwap?` | `() => void` |
    | 53 | `swapSelected?` | `boolean` |
    | 54 | `onResultsToggle?` | `() => void` |
    | 55 | `onAlgorithmToggle?` | `() => void` |
    | 56 | `onThresholdSelect?` | `(threshold: number) => void` |
    | 57 | `onLeftArrow?` | `() => void` |
    | 58 | `onRightArrow?` | `() => void` |
    | 59 | `onExportToggle?` | `() => void` |
    | 60 | `onCopyUrl?` | `() => void` |
    | 61 | `onDownloadMd?` | `() => void` |
    | 62 | `className?` | `string` |

    ### Refs
    - `prevStateRef` (90) — last known `state` value.
    - `isAnimatingRef` (91) — animation lock; blocks the per-render resting-state reapplication.
    - `visualStateRef` (92) — what GSAP considers "current".
    - `resultsExpandedRef` (95) — thresholds container div.
    - `algorithmRef` (96) — WCAG/APCA button, the Flip anchor.
    - `arrowsRef` (97) — `useRef<ArrowsHandle>` pointing into the `Arrows` component.
    - `exportOptionsRef` (98) — export options container div.

    ### `getControlBarMotion()` helper (lines 33–37)
    ```ts
    function getControlBarMotion(): { duration: number; ease: string } {
      if (typeof window === 'undefined') return { duration: 0.2, ease: 'power2.out' };
      const m = (window as any).__motion;
      return m?.controlBar ?? { duration: 0.2, ease: 'power2.out' };
    }
    ```

    ### `applyRestingState(state)` function (lines 106–117)
    Sets GSAP ground truth per state:

    **default** (lines 107–109):
    ```js
    gsap.set(resultsExpandedRef.current, { position: 'absolute', autoAlpha: 0, x: -16 });
    gsap.set(exportOptionsRef.current, { autoAlpha: 0, x: 16, position: 'absolute' });
    ```

    **score** (lines 110–112):
    ```js
    gsap.set(resultsExpandedRef.current, { position: 'relative', autoAlpha: 1, x: 0 });
    gsap.set(exportOptionsRef.current, { autoAlpha: 0, x: 16, position: 'absolute' });
    ```

    **export** (lines 113–115):
    ```js
    gsap.set(resultsExpandedRef.current, { position: 'absolute', autoAlpha: 0, x: -16 });
    gsap.set(exportOptionsRef.current, { autoAlpha: 1, x: 0, position: 'relative' });
    ```

    Pattern: results and export options are mutually exclusive. One is `position: relative` and occupies flow; the other is `position: absolute` with `x: ±16` and `autoAlpha: 0`. Algorithm button is always in flow; its position morphs via Flip as the surrounding layout shifts.

    ### Per-render `useLayoutEffect` (lines 121–125)
    ```ts
    useLayoutEffect(() => {
      if (!isAnimatingRef.current) {
        applyRestingState(visualStateRef.current);
      }
    });
    ```
    **No dependency array** — runs every render. React clears inline styles between renders; this guard re-asserts GSAP's work unless an animation is in flight.

    ### State-transition `useLayoutEffect` (lines 129–202)
    Deps: `[state]`. Flow:
    1. Detect `state !== prevStateRef.current`.
    2. Restore previous visual state: `applyRestingState(visualStateRef.current)`.
    3. `isAnimatingRef = true`.
    4. Define `onDone`: marks `isAnimatingRef = false`, updates `visualStateRef = state`, re-asserts `applyRestingState(state)`.
    5. Read `cb = getControlBarMotion()`, `DUR = cb.duration`.
    6. Branch on transition:

    #### default → export (lines 150–154)
    ```js
    gsap.set(exportOptionsRef.current, { position: 'relative' });
    gsap.fromTo(exportOptionsRef.current,
      { autoAlpha: 0, x: 16 },
      { autoAlpha: 1, x: 0, duration: DUR, ease: cb.ease, onComplete: onDone }
    );
    ```

    #### export → default (lines 157–160)
    ```js
    gsap.to(exportOptionsRef.current, { autoAlpha: 0, x: 16, duration: DUR, ease: cb.ease, onComplete: onDone });
    gsap.set(exportOptionsRef.current, { position: 'absolute', delay: DUR });
    ```
    Position reset deferred to after duration.

    #### default → score (lines 163–168)
    ```js
    const flipState = Flip.getState(algorithmRef.current);
    gsap.set(resultsExpandedRef.current, { position: 'relative', autoAlpha: 0, x: -16 });
    Flip.from(flipState, d);  // d = { duration: DUR, ease: cb.ease }
    gsap.to(resultsExpandedRef.current, { autoAlpha: 1, x: 0, duration: DUR, ease: cb.ease, onComplete: onDone });
    ```
    `Flip.getState` captures algorithm button's pre-change position; after results container flips from absolute to relative, the button's layout shifts, and `Flip.from` morphs it to the new location over `DUR`.

    #### score → default (lines 171–176)
    ```js
    const flipState = Flip.getState(algorithmRef.current);
    gsap.set(resultsExpandedRef.current, { position: 'absolute' });
    Flip.from(flipState, d);
    gsap.to(resultsExpandedRef.current, { autoAlpha: 0, x: -16, duration: DUR, ease: cb.ease, onComplete: onDone });
    ```

    #### score → export (lines 179–187)
    ```js
    const flipState = Flip.getState(algorithmRef.current);
    gsap.set(resultsExpandedRef.current, { position: 'absolute' });
    Flip.from(flipState, d);
    gsap.to(resultsExpandedRef.current, { autoAlpha: 0, x: -16, duration: DUR, ease: cb.ease });
    gsap.set(exportOptionsRef.current, { position: 'relative' });
    gsap.fromTo(exportOptionsRef.current,
      { autoAlpha: 0, x: 16 },
      { autoAlpha: 1, x: 0, duration: DUR, ease: cb.ease, onComplete: onDone }
    );
    ```
    Parallel: thresholds out, export in. **Only the export `gsap.fromTo` carries `onDone`.**

    #### export → score (lines 190–197)
    Reverse. **Only the thresholds `gsap.to` carries `onDone`.**

    ### Inline CSS transitions (not GSAP)
    Three wrappers use `transition: 'opacity var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))'`:
    - Lines 234–238: mobile arrows wrapper (opacity toggles based on `state === 'export'`)
    - Lines 247–252: mobile export options
    - Lines 319–322: desktop arrows wrapper

    These fade in/out via CSS, not GSAP, so they don't collide with Flip.

    ### Mobile branch STILL PRESENT (lines 231–275)
    **Confirmed**: the file still renders a full mobile-only right-side layout gated on `sm:hidden`:
    ```
    <div className="flex items-center shrink-0 sm:hidden">
      {/* Arrows with CSS transition fade */}
      <div style={{ opacity: state === 'export' ? 0 : 1, ... }} className="mr-1">
        <Arrows ref={arrowsRef} onLeft={onLeftArrow} onRight={onRightArrow} />
      </div>
      {/* Export options + EXPORT button */}
      <div className="flex items-center gap-1 shrink-0 relative">
        <div style={{ opacity: state === 'export' ? 1 : 0, ... }}>
          <CSButton label="COPY URL" onClick={onCopyUrl} />
          <CSButton label="DOWNLOAD .MD" onClick={onDownloadMd} />
        </div>
        <button onClick={onExportToggle}>{/* TubeText EXPORT */}</button>
      </div>
    </div>
    ```
    **This coexists with the new mobile path in `control-container.tsx`.** Both render on mobile (since `control-container.tsx`'s mobile branch ALSO includes this `ControlsBar` indirectly via the desktop render path, wait no — it's wrapped in `hidden sm:flex` so it's desktop only). Actually: `control-container.tsx` renders `<ControlsBar>` only inside its `hidden sm:flex` wrapper, so the ControlsBar is desktop-only. Therefore its own `sm:hidden` internal branch is **dead code** — it would only render if ControlsBar were mounted on mobile, which it isn't.

    **Recommendation**: delete lines 231–275 of controls-bar.tsx. Dead code.

    ### Fragilities (per-agent analysis)
    1. **Per-render `useLayoutEffect` with no deps** (121–125) runs every frame. Guards mitigate but add overhead.
    2. **Parallel GSAP animations without chaining** (lines 183, 191): two `gsap.to()` calls back-to-back, only the second's `onComplete` fires. If the first finishes early, `visualStateRef` could be stale.
    3. **React style clearing hazard**: comments acknowledge React clears inline styles. The per-render guard mitigates but doesn't eliminate race conditions during React's commit phase.
    4. **Flip.getState on unrendered element**: calls `Flip.getState(algorithmRef.current)` during transition useLayoutEffect. If ref is null or layout hasn't settled, captures stale geometry.
    5. **No cleanup on unmount**: state-transition useLayoutEffect has no return. If unmounted mid-animation, `onDone` has no effect, next mount has stale `prevStateRef`.

    ---

    ## 12. DialKit + Motion Plumbing

    **Status**: `DialKitWrapper` and `AgentationWrapper` are commented out in `layout.tsx`. The `useDialKit()` hook inside `color-shift.tsx` **still runs**, returning library defaults which get mirrored to `window.__motion` and CSS vars. Nothing breaks — every consumer has hardcoded fallbacks.

    ### Consumers of `window.__motion` / CSS vars (complete list)
    - `strip-transition.tsx`:
      - Lines 16–24: `getMotionParams()` fallback
      - Lines 65, 103, 111, 122: photo transition + hover + click reads
    - `controls-bar.tsx`:
      - Lines 33–37: `getControlBarMotion()` fallback
      - Lines 145–147: Flip durations
      - Lines 237, 252, 322: opacity CSS transitions with `var(--cb-duration)` / `var(--cb-ease)`
    - `control-container.tsx`:
      - Lines 96, 106, 197, 207: YPanel grid-rows + transform transitions
      - Mobile YPanel helper uses CSS vars throughout
    - `color-shift.tsx`:
      - Lines 211–216: writes `window.__motion`
      - Lines 220–221: writes `--cb-duration`, `--cb-ease`

    ### Fallback values (hardcoded per site)
    - `--cb-duration`: `0.2s`
    - `--cb-ease`: `cubic-bezier(0.33, 1, 0.68, 1)` (≈ `power2.out`)
    - Motion params fallback: `hover {1.05, 1s, power4.out, 1.01, 0.4}`, `click {0.3, power4.out}`, `photo {fade, 0, 1.05, 1, power4.out}`, `controlBar {0.2, power2.out}`.

    ### `dialkit-wrapper.tsx`
    - Renders `<DialRoot defaultOpen={false} />` (single prop).
    - Draggable header via pointer-down/move/up on `.dialkit-panel-header`, ignores descendant buttons/inputs/selects. Boundary clamps: `maxX = innerWidth - 100`, `maxY = innerHeight - 40`.
    - localStorage key `'dialkit-position'`, shape `{x, y}`, init `{x: 16, y: 16}`. Persisted on every position change, loaded on mount with try/catch.
    - Style override block (lines 89–96) forces panel to dynamic `top/left` with `!important`.

    ### `agentation-wrapper.tsx`
    Renders `<Agentation />` from `'agentation'` package only when `process.env.NODE_ENV === 'development'`. No props. Dev-only passive annotation shim.

    ### `dev-tools.tsx`
    Full content:
    ```tsx
    'use client';
    // DialKit and InterfaceKit temporarily disabled
    // import { DialRoot, useDialKit } from 'dialkit';
    // import { InterfaceKit } from 'interface-kit/react';
    export function DevTools() {
      return null;
    }
    ```
    Neutered stub with commented legacy imports. Still mounted in `layout.tsx` — no-op.

    ---

    ## 13. GSAP Configuration (`src/lib/gsap-config.ts`)

    ### Imports (lines 3–10)
    ```ts
    import gsap from 'gsap';
    import { useGSAP } from '@gsap/react';
    import { Flip } from 'gsap/Flip';
    import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
    import { Draggable } from 'gsap/Draggable';
    import { InertiaPlugin } from 'gsap/InertiaPlugin';
    import { SplitText } from 'gsap/SplitText';
    import { CustomEase } from 'gsap/CustomEase';
    ```

    ### Registration (line 12)
    ```ts
    gsap.registerPlugin(Flip, MorphSVGPlugin, Draggable, InertiaPlugin, SplitText, CustomEase, useGSAP);
    ```

    ### Global defaults (line 15)
    ```ts
    gsap.defaults({ ease: 'power2.out', duration: 0.4 });
    ```

    ### Reduced-motion accessibility (lines 18–26)
    ```ts
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) {
        gsap.globalTimeline.timeScale(1000);
      }
    }
    ```
    Scales global timeline 1000× to effectively disable all GSAP animations.

    ### Exports (lines 14, 28)
    `Draggable`, `gsap`, `Flip`, `SplitText`, `useGSAP`.

    ---

    ## 14. Fonts (`src/lib/fonts.ts`)

    ### `SPECIMEN_FONTS` (lines 3–24) — full 20-item array
    ```ts
    [
      'Playfair Display', 'DM Serif Display', 'Instrument Serif', 'Fraunces',
      'Crimson Pro', 'Source Serif 4', 'Literata', 'Lora', 'Space Mono',
      'JetBrains Mono', 'Syne', 'Bricolage Grotesque', 'Outfit',
      'Familjen Grotesk', 'Space Grotesk', 'Hanken Grotesk',
      'Libre Baskerville', 'Cormorant Garamond', 'Bodoni Moda',
      'Sorts Mill Goudy',
    ]
    ```

    ### `getGoogleFontsUrl()` (lines 27–30)
    ```ts
    const families = SPECIMEN_FONTS.map(f => `family=${f.replace(/ /g, '+')}`).join('&');
    return `https://fonts.googleapis.com/css2?${families}&text=Aa&display=swap`;
    ```
    `text=Aa` restricts the request to two glyphs per family — each specimen font weighs ~1–2KB.

    ### `getFontForPhoto(photoId)` (lines 33–40)
    ```ts
    let hash = 0;
    for (let i = 0; i < photoId.length; i++) {
      hash = ((hash << 5) - hash) + photoId.charCodeAt(i);
      hash |= 0;
    }
    return SPECIMEN_FONTS[Math.abs(hash) % SPECIMEN_FONTS.length];
    ```
    Bernstein-style 32-bit signed hash (`hash * 31 + charCode`), wrapped via `|= 0`, mod 20. Deterministic per photo id.

    Only three exports. No other functions.

    ---

    ## 15. Public Assets

    ```
    public/
      file.svg
      globe.svg
      next.svg
      vercel.svg
      window.svg
      icons/
        left.svg
        right.svg
        reverse.svg
    ```

    8 files total. The `icons/` subdirectory contains directional icons; the other 4 are Vercel/Next.js boilerplate + a window SVG + a file SVG.

    ---

    ## 16. Known Gaps, Risks, Fragilities

    ### Code health — confirmed dead code (grep-verified 2026-04-08)
    1. **`controls-bar.tsx` lines 231–275** (mobile branch inside the desktop-only ControlsBar) — dead. `ControlsBar` only renders inside `control-container.tsx`'s `hidden sm:flex` wrapper, so its internal `sm:hidden` branch never displays. Safe to delete.
    2. **`control-strip.tsx` entire `ControlStrip` component** (~1012 lines) — dead. Imported at `color-shift.tsx:29` but zero `<ControlStrip` JSX open tags anywhere in `src/`. Only the `PhotoData` type export is actually consumed. Extract the type and delete the file.
    3. **`src/components/photo-panel.tsx`** (225 lines, exports `PhotoPanel`) — dead. Zero imports of it anywhere in `src/`. Safe to delete.
    4. **`specimenInputRef` in `color-shift.tsx`** (line 225) and its three keyboard-handler guards (lines 575, 579–581) — dead. Never attached to any `ref=` prop anywhere in `src/`. The ref is always `null`, so the guards trivially pass. Delete both the ref declaration and the guards.
    5. **`_archive-strip-transition.tsx`** — filename prefix suggests archived. Verify and delete if so.
    6. **`motion` package** — zero imports across `src/`. Safe to remove from package.json.
    7. **`dev-tools.tsx`** is a null-returning stub with commented DialKit/InterfaceKit imports. Delete along with its line in `layout.tsx`.
    8. **APCA grade table duplicate**: `apcaGrade` returns `'Body ✓'` for both `>=90` and `>=75` (color-engine.ts lines 202–203). Investigate: intentional or bug.

    **Estimated dead-code removal**: ~1500 lines across 5 files + the specimenInputRef cleanup + the motion package + the controls-bar mobile branch. Significant cleanup opportunity.

    ### Runtime risks
    6. **Object URL leak on uploads**: `injectPhotoFromFile` never calls `URL.revokeObjectURL`. Session-scoped growth; acceptable for single-session tool but not for long-lived sessions.
    7. **Export/share implemented 2026-05-20**: COPY URL, COPY PARAMETERS, DOWNLOAD .MD, and direct Unsplash photo deep links are wired. Remaining risk is browser clipboard permission behavior on non-secure origins.
    8. **Unsplash free tier rate limit**: 50 req/hour/IP. `cache: 'no-store'` means every fetch hits upstream.
    9. **Hardcoded LAN IP** in `next.config.ts` (`allowedDevOrigins: ['192.168.86.41']`). Won't work from other devices; update when laptop switches networks.

    ### Fragilities
    10. **`controls-bar.tsx` GSAP Flip orchestration** depends on React's style-clearing behavior. Any edit to state-dependent JSX in its desktop path risks breaking Flip.
    11. **Per-render `useLayoutEffect`** in controls-bar runs every frame; guards mitigate but create overhead.
    12. **Parallel GSAP animations** in `score ↔ export` transitions only track one `onComplete` — if the untracked animation finishes first, state could get confused.
    13. **`Flip.getState` on potentially unrendered elements** risks stale geometry capture.
    14. **No unmount cleanup** in controls-bar state-transition effect — mid-animation unmount leaves stale refs.
    15. **DialKit tuning UI is commented out** but the hook still runs. Re-enabling requires uncommenting both `<DialKitWrapper />` and `<AgentationWrapper />` in `layout.tsx` and verifying the library still works with React 19.

    ### Map coverage gaps
    16. **`control-strip.tsx` sub-components not line-level read** — SliderPanel / ScorePanel / OklchSliders / HsbSliders / SliderRow. Moot since the whole file is dead code, but if you ever want to *revive* any of them, they'll need a real read first.
    17. **`photo-panel.tsx` not line-level read** — 225 lines, unused. If you ever want to reuse its UI, read it first.
    18. **`_archive-strip-transition.tsx` not read at all.**
    19. **`hsv`/`hsb` distinction** in culori: the map notes HSB uses HSV's `v` as brightness, but the precise conversion rules for edge cases (e.g., grayscale, full saturation) should be trusted from culori, not re-derived.
    20. **No tests exist.**

    ---

    ## 17. File Index

    ```
    color-shift/
      next.config.ts                              — allowedDevOrigins, images
      package.json                                — deps
      tsconfig.json                               — @/* alias
      eslint.config.mjs                           — next + TS
      postcss.config.mjs                          — @tailwindcss/postcss

      public/
        file.svg, globe.svg, next.svg, vercel.svg, window.svg
        icons/left.svg, right.svg, reverse.svg

      src/
        app/
          layout.tsx                              — fonts, viewport, theme-color
          page.tsx                                — <ColorShift />
          globals.css                             — Tailwind v4, motion vars, button press
          api/photos/route.ts                     — Unsplash proxy

        components/
          color-shift.tsx                         — THE BRAIN (665 lines)
          strip-transition.tsx                    — color + photo panels, drag-drop (278 lines)
          control-strip.tsx                       — DEAD (1012 lines, only PhotoData type is used)
          photo-panel.tsx                         — DEAD (225 lines, zero imports)
          _archive-strip-transition.tsx           — archive (unread)
          dialkit-wrapper.tsx                     — DialKit tuning overlay (commented in layout)
          agentation-wrapper.tsx                  — dev-only annotation (commented)
          dev-tools.tsx                           — null stub
          ui/
            index.ts                              — re-exports
            control-container.tsx                 — MOBILE + DESKTOP dock
            controls-bar.tsx                      — DESKTOP ONLY Flip orchestrator (361 lines)
            color-slider.tsx                      — slider primitive
            color-sliders.tsx                     — 3-slider group
            color-mode.tsx                        — OKLCH/HSB/RGB tabs (h-7 removed)
            score.tsx                             — score pill
            tube-text.tsx                         — char rotate animation
            cs-button.tsx                         — universal button
            swatch.tsx, swatches.tsx
            icons.tsx                             — LeftArrow, RightArrow, SwapArrows
            icon-button.tsx, arrows.tsx, grip.tsx
            threshold-buttons.tsx                 — desktop only
            results.tsx                           — desktop only
            export-panel.tsx                      — desktop only

        lib/
          color-engine.ts                         — ALL color + contrast math
          fonts.ts                                — SPECIMEN_FONTS + hash
          gsap-config.ts                          — plugin registration + reduced-motion

        fonts/
          AlphaLyrae-Medium.woff2
          DepartureMono-Regular.woff2
          GhostByte-Regular.woff
          InputMono-Regular.woff2
          InputMono-Medium.woff2
    ```

    ## Warnings

    - This map reflects the repo on 2026-04-08. Verify symbols and paths against live code before recommending changes.
    - Do NOT edit `controls-bar.tsx` without reading it in full first. It is the most fragile file in the repo.
    - Do NOT modify primitives casually — the mobile and desktop paths share them.
    - Do NOT assume DialKit is unused just because the wrapper is commented. `useDialKit()` still runs and writes `window.__motion` + CSS vars.
    - Do NOT delete `control-strip.tsx` without first confirming where `PhotoData` is imported from and whether `<ControlStrip />` is actually rendered anywhere.

    Created by MDS and Claude Opus 4.6 (1M context)
  </md>
</fp>

<!-- Color Shift — exhaustive project map, compiled 2026-04-08 from eleven parallel Explore-agent deep reads (six initial, five targeted follow-ups) -->
