# FIGMA_CONTEXT.md — Color Shift

> Agent-first context map for a future agent starting a new session with zero prior context of this Figma file.

## Freshness

| Field | Value |
|-------|-------|
| Generated | 2026-05-04 |
| Figma file URL | `https://www.figma.com/design/Nh3lASTnhhuGcSMYRJPiyW/Color-Shift?node-id=33-476` |
| Figma file key | `Nh3lASTnhhuGcSMYRJPiyW` |
| Figma file name | `Color-Shift` (from URL slug; not surfaced by MCP) |
| Primary node ID | `33:476` (page: components) |
| Scanned page node IDs | `33:476` (components — full), `0:1` (↳ original explorations — root only) |
| MCP calls run | `get_metadata(33:476)`, `get_metadata(0:1)`, `get_screenshot(33:476)` |
| Screenshots requested | `33:476` |
| Exclusions | none specified |
| Stale-risk areas | "build" frames may not match current production Figma intent; the duplicate "control container " (with trailing space) and the bottom-right "Controls" CamelCase frame may drift first |

## Reader Contract

This file is for a brand-new agent in a new session with zero prior context of this Figma file. It is a context assistant generated from Figma source evidence. It is not the canonical source of truth for the design system. When source truth matters, re-check the Figma node IDs listed here.

## Agent Quickstart

1. Read this file before working from the Figma design.
2. If doing UI/code work, read **Component Inventory** and **Hierarchy** before generating code.
3. Call `mcp__figma-official__get_screenshot` on `33:476` for a fresh visual reference when visual fidelity matters.
4. Check **Gotchas / Things to Know** before assuming production readiness — there are two non-production zones (one CamelCase exploratory frame, one duplicate-named container) that should not be used as canonical sources.
5. Treat `UNKNOWN` items as required follow-up evidence, not optional polish.

## Source Inventory

| Source | Node ID / Scope | Tool | Status | Notes |
|--------|------------------|------|--------|-------|
| Page metadata: components | `33:476` | `mcp__figma-official__get_metadata` | inspected | Full structural read of components page |
| Page metadata: ↳ original explorations | `0:1` | `mcp__figma-official__get_metadata` | inspected (root only) | Page exists; contents not deeply scanned for standard depth |
| Components page screenshot | `33:476` | `mcp__figma-official__get_screenshot` | inspected | Visual confirmation of layout |
| Other pages in file | UNKNOWN | not called | skipped | Figma file may have additional pages; MCP `get_metadata` at single nodes does not surface sibling pages |

## File Overview

- **What this file is:** The Figma design file for Color Shift, a single-page color contrast tool that ships at `/Users/mds/Documents/github/color-shift`.
- **What it contains:** A components page (`33:476`) with the production component system — symbols and component sets with explicit variants — plus build/composition frames showing the assembled app, plus an explorations page (`0:1`).
- **Project/design context:** Two-color playground with slider-driven editing, photo-palette extraction, APCA + WCAG scoring, and a font specimen viewer. Repo `CLAUDE.md` and `PROJECT_MAP.md` document the code side.
- **Primary page to start from:** `components` / `33:476`
- **Known status:** Mixed — components page is production-ready; "↳ original explorations" is exploration; one CamelCase frame on the components page is also exploratory and should not be used as a production source (see Gotchas).

Evidence: `get_metadata(33:476)` returned a single canvas with named symbols, frames containing variants, and labeled atomic primitives. `get_metadata(0:1)` returned a separate canvas named "↳ original explorations".

## Pages Map

| Page | Node ID | Purpose | Status | Agent Notes |
|------|---------|---------|--------|-------------|
| components | `33:476` | Production component system + build frames | inspected | Start here for any UI/code work |
| ↳ original explorations | `0:1` | Early moodboard / specimen exploration | inspected (root only) | Skim only; not the production source |
| (other pages) | UNKNOWN | UNKNOWN | skipped | If a sibling page is needed, request it by node ID |

## Component Inventory

### Atomic symbols (no variants)

| Component | Node ID | Dimensions | Variant Axes | Variant Values | Parent / Nested In | Notes |
|-----------|---------|------------|--------------|----------------|--------------------|-------|
| `swatch` | `33:415` | 12×12 | none | none | `swatches` | Smallest color primitive |
| `track` | `33:2131` | 1048×8 | none | none | `slider` | 8px track height |
| `slider values` | `33:2132` | 1046×12 | none | none | `sliders` | UNKNOWN: relationship to `slider` symbol |
| `slider` | `33:2138` | 1048×28 | none | none | `sliders` | Combines grip + track |
| `sliders` | `33:2162` | 1048×108 | none | none | container | Three sliders stacked = 108px |
| `color sliders` | `33:2203` | 1047×108 | none | none | container | Likely sliders + values composed |
| `color mode` | `33:2333` | 1048×28 | none | none | container | OKLCH/HSB/RGB tabs |
| `colors` | `33:2114` | 141×28 | none | none | UNKNOWN | UNKNOWN: usage site |
| `swatches` | `33:1206` | 212×28 | none | none | `controls` (left) | Composed from `swatch` |
| `arrows` | `33:1592` | 68×28 | none | none | `controls` (right) | Photo navigation left/right |
| `results expanded` | `33:1330` | 306×28 | none | none | UNKNOWN | UNKNOWN: usage site |
| `control container` | `33:2305` | 1074×204 | none | none | top-level | Dock shell |
| `icon / left` | `19:808` | 24×24 | none | none | icon container | Standard icon size |
| `icon / right` | `19:807` | 24×24 | none | none | icon container | Standard icon size |
| `icon / reverse` | `22:942` | 24×24 | none | none | icon container | Standard icon size |

### Component sets (with variants)

| Component | Node ID | Dimensions (frame) | Variant Axes | Variant Values | Parent / Nested In | Notes |
|-----------|---------|---------------------|--------------|----------------|--------------------|-------|
| `button` | `33:428` | 122×144 (variant frame) | `state` | `default` (`33:419`, 82×28), `hover` (`33:438`, 82×28), `selected` (`33:442`, 82×28) | `controls` | Three-state pattern, 28px tall |
| `icon container` | `33:1131` | 114×68 | `state` | `default` (`19:633`, 32×28), `hover` (`33:1132`, 32×28) | `controls` (right) | Two-state |
| `grip` | `33:2128` | 108×64 | `expanded` | `false` (`33:2127`, 24×24), `true` (`33:2126`, 24×24) | `slider` | 24×24 hit target invariant |
| `results` | `33:1351` | 315×106 | `expanded` | `false` (`33:1208`, 154×28), `true` (`33:1352`, 275×28) | `controls` (right) | Width changes with state |
| `scores` | `33:1249` | 188×76 | `score` | `acpa` (`33:1248`, 140×28), `wcag` (`33:1250`, 168×28) | `controls` (right) | Width changes per algorithm |
| `score` | `33:1445` | 143×258 | `score`, `state` (two-axis) | `wcag/default` (`33:1444`), `acpa/default` (`33:1446`), `score4/hovered` (`33:1470`), `score3/hovered` (`33:1476`), `score4/selected` (`33:1494`), `score3/selected` (`33:1500`) — all 103×28 | `controls` (left) | Six total variants combining algorithm × interaction state |
| `export` | `33:1878` | 296×106 | `expanded` | `false` (`33:1877`, 62×28), `true` (`33:1879`, 256×28) | `controls` (right) | Width changes with state |
| `controls` | `33:2263` | 1114×164 | `state` | `default` (`33:2260`, 1074×28), `score` (`33:2261`, 1074×28), `export` (`33:2262`, 1074×28) | `control container` | Whole control bar has three modes; matches `controlsState` in code |

## Hierarchy

### Atomic Components

| Component | Node ID | Used By | Notes |
|-----------|---------|---------|-------|
| `swatch` | `33:415` | `swatches` | 12×12 base unit |
| `track` | `33:2131` | `slider` | 8px |
| `icon / left` `icon / right` `icon / reverse` | `19:808` `19:807` `22:942` | `icon container` (variants) | All 24×24 |

### Compound Components

| Component | Node ID | Contains | Used By | Notes |
|-----------|---------|----------|---------|-------|
| `slider` | `33:2138` | `track`, `grip` (likely) | `sliders`, `color sliders` | UNKNOWN: full child list — not surfaced in metadata |
| `swatches` | `33:1206` | `swatch` × N | `controls` (left) | Atomic-to-compound |
| `sliders` | `33:2162` | `slider` × 3 | container | 108px stack |
| `color sliders` | `33:2203` | UNKNOWN | container | UNKNOWN: relationship to `sliders` |
| `icon container` | `33:1131` | `icon / *` | `controls` (right) | State-driven icon wrapper |
| `controls` | `33:2263` | `swatches`, `score`, `arrows`, `button`, `export`, `scores` | `control container` | Composed dock bar |

### Containers / Screens / Groups

| Container | Node ID | Contains | Purpose | Notes |
|-----------|---------|----------|---------|-------|
| `control container` | `33:2305` | `controls`, `sliders` (when expanded) | Dock shell | 1074×204 — full dock area with expanded sliders |
| `build` (composition example 1) | `33:2352` | `canvas` (color+photo split), `control container` | Full app composition example | 1080×874 |
| `build` (composition example 2) | `119:4891` | Same as above | Likely earlier iteration | Off-canvas to the left (x=-975) |
| `build` (composition example 3) | `55:5117` | `canvas` with ellipse, `control container` | Variant composition with 830px tall canvas + ellipse on color side | UNKNOWN: production status |

## Conventions Observed

| Convention Type | Pattern | Evidence | Agent Notes |
|-----------------|---------|----------|-------------|
| Naming | Lowercase, function-named (`button`, `slider`, `grip`, `score`, `swatches`) | All component IDs on page `33:476` | Match this pattern when adding components |
| Variants | `state=default/hover/selected`, `expanded=false/true`, `score=wcag/acpa/score3/score4` | `33:428`, `33:2128`, `33:1445` | Two-axis variants exist (`score` × `state` on `score` component) |
| Sizing — control bar height | 28px | `button`, `icon container`, `grip` (24×24 fits within), `score`, `scores`, `export`, `controls` all share 28 | Strong invariant; bar elements expect 28 |
| Sizing — track height | 8px | `track` (`33:2131`), 1048×8 | Verified against repo `globals.css` (track 6px there — see Gotchas) |
| Sizing — hit target | 24×24 | `grip` (both variants), `icon / *` (all three) | Hit-target convention, matches MDS BTS audit |
| Sizing — control container width | 1074px | `control container` (`33:2305`), `controls` variants all 1074×28 | Bar interior width invariant |
| Layout — control container | sliders stack above 28px controls bar | `control container` (`33:2305`) is 1074×204, controls bar is 28 | `204 - 28 = 176` of slider/expansion space |

## Gotchas / Things to Know

- **Bottom-right "Controls" frame is exploratory, not production.** Node `107:1495` (1158×324.5, position `2534, 4721`) uses CamelCase naming (`Container`, `SliderGroup`, `SliderRow`, `Range Slider`, `ColorValue`, `Button`, `HEX`, `AAA`, `ChevronUp`/`ChevronDown`, `ShuffleIcon`, `SunIcon`, `DownloadIcon`, `CopyIcon`, `Generate`, `H/S/B` text labels) and is built from raw frames, not symbols. **It does not match the lowercase function-named symbol convention used everywhere else.** Treat as exploration; do not use as a production source.
- **"control container " with trailing space (`63:5783`) is a duplicate/alternate of `33:2305`.** Same name, trailing whitespace differentiates. UNKNOWN: which is canonical. Default to `33:2305` (the symbol) until clarified.
- **Three "build" frames** (`33:2352`, `119:4891`, `55:5117`) are full-app composition examples at slightly different sizes/structures. UNKNOWN: which is current. The third (`55:5117`) has an ellipse instead of "Aa" text on the color half — likely a different specimen mode.
- **Track height differs between Figma and code.** Figma `track` symbol (`33:2131`) is 8px tall. Repo `src/app/globals.css` lines 82–119 show `<input type=range>` track at 6px tall. UNKNOWN: which is canonical for production. Re-check before changing slider chrome.
- **"slider values" (`33:2132`) and "color sliders" (`33:2203`) relationships are unclear.** Both exist as symbols with overlapping size profiles; the metadata does not surface their child structure. UNKNOWN: which is the canonical "stacked slider rows" symbol. Likely `color sliders` per the name, but verify with `get_design_context` before reuse.
- **`gradient inner box shadow` frame (`69:1497`)** is not a component — it's a frame containing two `track` instances with shadows applied. Visual reference for track styling, not a reusable symbol.
- **`colors` (`33:2114`, 141×28) and `results expanded` (`33:1330`, 306×28) usage sites are not surfaced in metadata.** UNKNOWN: where they nest in production composition.

## Safe Next Actions

| Goal | Start Here | Fresh Check | Notes |
|------|------------|-------------|-------|
| Implement a control-bar component | `controls` (`33:2263`) | `get_screenshot(33:2263)` + `get_design_context(33:2263)` | Three states: default/score/export, all 1074×28 |
| Implement the score pill | `score` (`33:1445`) | `get_design_context(33:1445)` | Six variants combining `score` × `state` axes |
| Implement the slider grip | `grip` (`33:2128`) | `get_design_context(33:2128)` | 24×24 hit target, expanded `false`/`true` |
| Build the dock shell | `control container` (`33:2305`) | `get_screenshot(33:2305)` | 1074×204; controls bar at bottom, sliders above when expanded |
| Reference a full app composition | `build` frames (`33:2352`, `119:4891`, `55:5117`) | `get_screenshot` on the chosen one | Pick canonical before using; UNKNOWN which is current |
| Audit naming conventions | scan component inventory above | none needed | Lowercase function-named is the rule; CamelCase frames are exploration |

## Open Questions / UNKNOWN

| Unknown | Why It Matters | Next Evidence to Collect |
|---------|----------------|--------------------------|
| Which "build" frame is canonical | Three composition examples exist; agents picking one for reference might pick the stale one | `get_design_context(33:2352)` and compare against shipped app at `/Users/mds/Documents/github/color-shift/src/components/color-shift.tsx` |
| Which "control container" is canonical (`33:2305` vs `63:5783` with trailing space) | Duplicate/alternate could drift from the production version | `get_design_context` on both, compare structures |
| Track height: Figma 8px vs code 6px | Affects slider chrome visual match | Read `src/app/globals.css:82-119` for code source; ask MDS for canonical |
| Other pages in the Figma file | File may have more pages (typography, screens, marketing) not yet scanned | Open Figma desktop and list page tabs; or call `get_metadata` with each candidate page node ID |
| `slider` symbol (`33:2138`) child structure | Hierarchy of grip + track inside slider is implied but not surfaced in metadata | `get_design_context(33:2138)` |
| `color sliders` (`33:2203`) vs `sliders` (`33:2162`) relationship | Both exist as symbols; unclear which is composed from which | `get_design_context` on both |
| `colors` (`33:2114`) usage site | Cannot recommend reuse without knowing where it appears | `get_design_context(33:2114)` |
| `results expanded` (`33:1330`) usage site | Naming suggests one of the `results` variant states, but it's a separate symbol | `get_design_context(33:1330)` and compare to `results` frame `33:1351` |
| Full content of `↳ original explorations` page (`0:1`) | May contain canonical typography or specimen logic referenced by `Aa` text | Targeted scan if specimen work is in scope |

---

**End of FIGMA_CONTEXT.md.**
