# Color Shift

Single-page color contrast tool. Pick a background and foreground, see the contrast, feel the combination. Two-color playground with slider-driven editing, photo-palette extraction, APCA + WCAG scoring, and a font specimen viewer.

> **This is not the Next.js you know.** Next.js 16.2.1 + React 19.2 + Tailwind v4. APIs differ from training data. Read `node_modules/next/dist/docs/` before writing Next-specific code. See `AGENTS.md`.

## Stack

- **Framework:** Next.js 16.2.1 App Router, React 19.2, TypeScript 5
- **Styling:** Tailwind v4 (`@tailwindcss/postcss`), no `tailwind.config` — config lives in `globals.css`
- **Package manager:** pnpm (workspace-enabled via `pnpm-workspace.yaml`)
- **Color math:** `culori` (conversions), `apca-w3` (APCA contrast), `node-vibrant` (palette extraction from photos)
- **Animation:** `gsap` + `@gsap/react` (desktop state transitions, Flip plugin), `motion` (available, used sparingly), `dialkit` (live runtime motion tuning via overlay)
- **Typography:** `opentype.js` for font-path extraction (specimen renderer), plus seven font families — Geist, Geist Mono, Instrument Serif, Alpha Lyrae, Departure Mono, Ghost Byte, Input Mono. Precompute script at `scripts/precompute-font-paths.js` → `src/lib/font-path-data.json`.
- **Dev tools:** `agentation` (in-browser annotation overlay, wrapper currently commented out in `layout.tsx`)

## Architecture

Everything is one page. `src/app/page.tsx` renders `<ColorShift />`.

```
src/
├── app/
│   ├── layout.tsx              # Fonts, metadata, theme-color meta, DevTools mount
│   ├── page.tsx                # <ColorShift /> only
│   ├── globals.css             # Tailwind v4 config + design tokens
│   └── api/
│       └── photos/route.ts     # Unsplash rotator + direct photo lookup (/api/photos)
├── components/
│   ├── color-shift.tsx         # 665-line client component — all state lives here
│   ├── strip-transition.tsx    # Color panel + photo panel stacked display
│   ├── photo-panel.tsx         # Photo display + Vibrant palette extraction
│   ├── control-strip.tsx       # Legacy/alt control bar
│   ├── specimen.tsx            # Font specimen renderer (opentype.js paths)
│   ├── dev-tools.tsx           # Dev-only overlay
│   ├── dialkit-wrapper.tsx     # Motion tuning overlay (commented out)
│   ├── agentation-wrapper.tsx  # Annotation overlay (commented out)
│   └── ui/                     # Primitives — see rules below
│       ├── control-container.tsx   # Dock shell, slider-panel grid-rows animation
│       ├── controls-bar.tsx        # Desktop GSAP Flip state machine, 361 lines
│       ├── swatches.tsx / swatch.tsx
│       ├── score.tsx               # Contrast score pill
│       ├── color-sliders.tsx / color-slider.tsx
│       ├── color-mode.tsx          # OKLCH / HSB / RGB tabs
│       ├── arrows.tsx              # Photo nav left/right
│       ├── threshold-buttons.tsx
│       ├── results.tsx / export-panel.tsx
│       ├── cs-button.tsx / icon-button.tsx / icons.tsx / grip.tsx / tube-text.tsx
│       └── index.ts
├── lib/
│   ├── color-engine.ts         # 529 lines — all color math, conversions, contrast, export
│   ├── fonts.ts                # Google Fonts URL builder
│   ├── font-paths.ts           # Precomputed specimen path loader
│   ├── font-path-data.json     # Precomputed opentype paths
│   ├── gsap-config.ts          # Plugin registration
│   └── transitions.md          # Animation notes
└── fonts/                      # Local font files (.woff, .woff2, .otf)
```

## Core State Model (color-shift.tsx)

All state lives in the top-level `ColorShift` client component. Keep it that way.

- `bgHex`, `fgHex` — the two colors (hex strings)
- `slidersExpanded: boolean` — slider panel open/closed
- `controlsState: 'default' | 'score' | 'export'` — dock bar mode
- `sliderTarget: 'bg' | 'fg'` — which color the sliders edit
- `sliderMode: 'OKLCH' | 'HSB' | 'RGB'` — active slider model
- `contrastAlgorithm: 'WCAG2' | 'APCA'`

Tapping FG/BG swatches toggles `slidersExpanded` + `sliderTarget`. Tapping the score or export button drives `controlsState`. iOS Safari top-chrome tinting is handled by destroying and re-appending the `meta[name=theme-color]` on every `bgHex` change (Safari ignores attribute updates).

## Color Engine (`src/lib/color-engine.ts`)

Single source of truth for all color math. Key exports:

- `hexToColorData(hex)` → `{ hex, rgb, hsl, hsb, oklch }` — canonical ColorData
- `hsbToHex`, `oklchToHex`, `rgbToHex` — inverse converters
- `maxChroma(l, h)` — gamut-aware chroma ceiling for OKLCH sliders
- `getContrastResult(bg, fg, algorithm)` — returns score + grade
- `bumpToThreshold`, `nearestThreshold`, `nextThresholdUp`, `nextThresholdDown` — threshold jumping
- `parseAnyColor`, `extractContrastPair` — URL/input parsing
- `generateExportMarkdown` — export format for the dock EXPORT action
- `isHexDark`, `formatColorValue` — utilities

Slider-to-hex plumbing in `color-shift.tsx` uses pure helpers `colorToPercent` / `percentToActual` / `actualToHex` to round-trip through the active `SliderMode` without drift.

## Animation Conventions

- **Desktop** (`sm:` and above): GSAP Flip + x-axis slides inside `controls-bar.tsx`. Fragile. Don't touch without reading `transitions.md`.
- **Mobile** (below `sm:`): y-axis only. CSS `grid-template-rows: 0fr ↔ 1fr` + `translateY` + `opacity`. Same mechanic as the current desktop slider panel in `control-container.tsx:98-131`. No GSAP on mobile.
- **Motion tuning:** DialKit writes to `window.__motion` and mirrors to CSS vars `--cb-duration`, `--cb-ease`. Components read the vars so tuning is live.
- **Default timing:** `var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))`

## UI Primitive Rules

Files in `src/components/ui/` are treated as stable primitives. When doing layout work:

- Reuse them verbatim — don't modify internals for a layout tweak
- New layouts compose existing primitives; don't spawn new UI files unless the design genuinely needs a new primitive
- Desktop and mobile share the same primitives; only their arrangement changes

## API Routes

- `GET /api/photos?count=N` — Unsplash random rotator. Cycles through a 44-query pool to force palette breadth (raw `/photos/random` is too narrow). Requires `UNSPLASH_ACCESS_KEY`.
- `GET /api/photos?id=<unsplashId>` — fetches one specific Unsplash photo for share/deep-link restoration.

## Export / Share Links

- `COPY URL` writes a deep link with `photo`, `bg`, `fg`, and `algo` query params when an Unsplash photo is active.
- `COPY PARAMETERS` writes just the query string parameters for handoff/debugging.
- `DOWNLOAD .MD` writes the same markdown export as `generateExportMarkdown`, including contrast data, share URL, and photo credit.
- On initial load, `color-shift.tsx` reads `photo`, `bg`, `fg`, and `algo` from `window.location.search`; direct photo links call `/api/photos?id=...`, then fill the rest of the buffer with random photos.

## Commands

```bash
pnpm dev             # Next dev server (allowedDevOrigins includes 192.168.86.41 for LAN testing)
pnpm build           # Production build
pnpm start           # Production server
pnpm lint            # ESLint (eslint-config-next)
```

Font path precompute (run after adding/updating a font):
```bash
node scripts/precompute-font-paths.js
```

## Environment

- `UNSPLASH_ACCESS_KEY` — required for `/api/photos`
- `next.config.ts` whitelists `images.unsplash.com` remote images and `192.168.86.41` as a dev origin

## Active Work

- **Mobile controls restructure** — see `MOBILE_CONTROLS_PLAN.md`. Four Figma frames (collapsed / expanded / score-selected / export-selected) at the `sm:` breakpoint. Layout-only, desktop byte-identical, y-axis animation only. Plan is a FloatPrompt-formatted brief; read it before touching any dock component.

## Do / Don't

- **Do** read `node_modules/next/dist/docs/` before using any Next.js API — this is Next 16 with breaking changes
- **Do** reuse primitives in `src/components/ui/` as-is
- **Do** route all color math through `color-engine.ts`
- **Do** keep state in `color-shift.tsx` — no Redux, no context, no prop-drilling rescue layers
- **Don't** add a second page — this is a single-page tool
- **Don't** modify `controls-bar.tsx` desktop GSAP code without reading `transitions.md` first
- **Don't** add x-axis motion on mobile
- **Don't** create new UI primitives for layout tweaks
