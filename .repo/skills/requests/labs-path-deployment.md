# Repo Skill Request: labs-path-deployment

## Request

Create a repo-local skill for Color Shift Labs path deployment work.

## Reason

Color Shift is mounted at labs.shiftnudge.com/color-shift through the separate shiftnudge-labs repo while this repo remains the source of truth for the app. Base path, API path, copied URLs, and Vercel deployment changes need explicit routing.

## Proposed Trigger

Use when changing NEXT_PUBLIC_BASE_PATH, labs.shiftnudge.com/color-shift routing, Vercel deployment, share URLs, or child app API paths.

## Source Files

- next.config.ts
- src/components/color-shift.tsx
- src/app/api/photos/route.ts
- CLAUDE.md
- README.md
- shiftnudge-labs/labs.config.json

## Required Coverage

- Keep Color Shift path-aware at /color-shift.
- Keep API requests under the configured base path.
- Keep the shiftnudge-labs registry as the Labs routing source of truth.
- Do not edit the main shiftnudge marketing-site repo for Labs routing.
- Verify local path behavior and live Labs routing after deployment changes.

## Escalation Status

deferred

Napoleon owns SKILL.md authoring. This repo-local request preserves the context until MDS routes that authoring work.

## Completion Definition

A repo-local SKILL.md exists, is listed under .repo/skills/MANIFEST.md metadata.config.skills, and defines verification for local path routing and live Labs routing.
