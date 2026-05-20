---
name: color-shift-skill-manifest
metadata:
  config: {
    "schema": "mds.repo-skill-manifest.v1",
    "repo": "color-shift",
    "updated_at": "2026-05-20",
    "source_window": {
      "branch": "main",
      "commit": "913801d"
    },
    "entrypoints": [
      "AGENTS.md",
      "CLAUDE.md",
      "PROJECT_MAP.md",
      "README.md",
      "next.config.ts",
      "src/app/page.tsx",
      "src/components/color-shift.tsx",
      "src/lib/color-engine.ts",
      "src/app/api/photos/route.ts"
    ],
    "skills": [],
    "skill_requests": [
      {
        "name": "color-shift-app",
        "reason": "Color Shift has durable app behavior for photo loading, palette extraction, export/share links, and contrast calculations that should have a repo-local skill before larger feature work.",
        "priority": "next",
        "repo_request_path": ".repo/skills/requests/color-shift-app.md",
        "escalation_status": "deferred",
        "napoleon_inbox_path": null,
        "escalation_reason": "Napoleon owns SKILL.md authoring. This request preserves repo context until MDS routes repo-local skill authoring.",
        "source_files": ["src/components/color-shift.tsx", "src/lib/color-engine.ts", "src/app/api/photos/route.ts"],
        "suggested_trigger": "Use when changing Color Shift app behavior, export/copy/share links, photo loading, color extraction, contrast calculations, or UI controls.",
        "completion_definition": "A repo-local SKILL.md exists, is listed under metadata.config.skills, and gives future agents required reading plus verification gates for app changes."
      },
      {
        "name": "labs-path-deployment",
        "reason": "Color Shift is mounted under labs.shiftnudge.com/color-shift through a separate Labs host, so path/basePath/deployment changes need explicit repo-local routing.",
        "priority": "next",
        "repo_request_path": ".repo/skills/requests/labs-path-deployment.md",
        "escalation_status": "deferred",
        "napoleon_inbox_path": null,
        "escalation_reason": "Napoleon owns SKILL.md authoring. This request preserves repo context until MDS routes repo-local skill authoring.",
        "source_files": ["next.config.ts", "src/components/color-shift.tsx", "CLAUDE.md"],
        "suggested_trigger": "Use when changing NEXT_PUBLIC_BASE_PATH, labs.shiftnudge.com/color-shift routing, Vercel deployment, share URLs, or child app API paths.",
        "completion_definition": "A repo-local SKILL.md exists, is listed under metadata.config.skills, and defines verification for local path routing and live Labs routing."
      }
    ]
  }
---

# Repo Skill Manifest

## Reader Contract

This repo is the source of truth for the Color Shift web application. The separate shiftnudge-labs repo owns the Labs host and route registry. The main shiftnudge marketing-site repo must not be edited for Color Shift or Labs routing.

Assigned agents should load this manifest before Color Shift work, then load the matching repo-local skill when Napoleon creates one. Until then, use AGENTS.md, CLAUDE.md, PROJECT_MAP.md, and the global repo-router / manifest skills as the governing map.

## Source Inventory

Primary sources:

- AGENTS.md requires checking local Next.js docs under node_modules/next/dist/docs/ before Next-specific code changes.
- CLAUDE.md is the working architecture brief for state, color math, export/share behavior, mobile controls, and Labs path deployment.
- PROJECT_MAP.md is the long-form repository map for cold-start agents.
- README.md describes setup and confirms export actions can copy the full URL, copy parameters, or download Markdown.
- next.config.ts owns the default /color-shift base path.
- src/components/color-shift.tsx owns client state, photo queue, URL params, copy actions, and export controls.
- src/lib/color-engine.ts owns color parsing, conversions, contrast scoring, palette extraction, and Markdown export generation.
- src/app/api/photos/route.ts owns Unsplash photo lookup and random photo loading.

No repo-local SKILL.md files existed at source window 913801d.

## Architecture Map

Color Shift is a Next.js App Router app with one primary interactive client component. It is path-aware for Labs deployment and defaults to /color-shift.

Major surfaces:

- App entry: src/app/page.tsx renders ColorShift.
- Client state and interactions: src/components/color-shift.tsx manages photo selection, extracted colors, active foreground/background colors, algorithm mode, export panel state, URL parameters, and copy/download actions.
- Color engine: src/lib/color-engine.ts keeps color conversion, WCAG/APCA contrast, palette extraction, parsing, and Markdown export as pure helper logic.
- Photo API: src/app/api/photos/route.ts talks to Unsplash using server-side environment configuration.
- Deployment path: next.config.ts sets basePath from NEXT_PUBLIC_BASE_PATH, defaulting to /color-shift; client API calls use the same base path.

High-risk surfaces: query parameter parsing, share URL generation, Markdown export, server-only Unsplash API usage, and Labs path routing.

## Source-to-Runtime Matrix

| Source concept | Evidence path | Runtime destination | Gate/output/test affected | Skill owner | Status |
| --- | --- | --- | --- | --- | --- |
| App shell | src/app/page.tsx, src/components/color-shift.tsx | color-shift Vercel app and labs.shiftnudge.com/color-shift | App loads and remains path-aware | requested: color-shift-app | active |
| Export and copy actions | src/components/color-shift.tsx, src/lib/color-engine.ts | Export panel copy URL, copy params, download Markdown | Share URL and Markdown output include active photo/color state | requested: color-shift-app | active |
| Direct photo links | src/components/color-shift.tsx, src/app/api/photos/route.ts | photo/bg/fg/algo query parameters | URL restore fetches direct photo and fills random buffer | requested: color-shift-app | active |
| Unsplash API | src/app/api/photos/route.ts | /color-shift/api/photos | Server-side API uses secrets only on the server | requested: color-shift-app | active |
| Labs deployment path | next.config.ts, src/components/color-shift.tsx, CLAUDE.md | labs.shiftnudge.com/color-shift via shiftnudge-labs/labs.config.json | Base path, assets, API routes, and copied share URLs stay aligned | requested: labs-path-deployment | active |

## Skill Coverage

No repo-local skills currently exist in this repo.

Use global companion skills until Napoleon authors repo-local skills: agent-repo-skill-router, agent-repo-skill-manifest, agent-github, vercel-react-best-practices, dev-design-engineering, visual-qa, and security companions when touching API/env/secret surfaces.

## Gaps / Skill Requests

- .repo/skills/requests/color-shift-app.md — deferred; Napoleon owns SKILL.md authoring.
- .repo/skills/requests/labs-path-deployment.md — deferred; Napoleon owns SKILL.md authoring.

No Napoleon inbox work order was filed in this pass because MDS asked T800 to use the router/manifest skills, not to assign Napoleon a new authoring job.

## Maintenance Notes

Last source window: branch main, commit 913801d.

For manifest-only changes, git diff --check plus path existence checks are sufficient. For app or deployment changes, run pnpm lint and pnpm build.
