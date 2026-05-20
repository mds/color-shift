# Repo Skill Request: color-shift-app

## Request

Create a repo-local skill for Color Shift web app changes.

## Reason

The repo has a durable app surface covering photo loading, palette extraction, contrast scoring, export/copy/share links, and mobile controls. Future agents need a small repo-local skill that turns AGENTS.md, CLAUDE.md, and the app architecture into a direct execution checklist.

## Proposed Trigger

Use when changing Color Shift app behavior, export/copy/share links, photo loading, color extraction, contrast calculations, or UI controls.

## Source Files

- src/components/color-shift.tsx
- src/lib/color-engine.ts
- src/app/api/photos/route.ts
- src/components/ui/*
- CLAUDE.md
- PROJECT_MAP.md

## Required Coverage

- Confirm Color Shift remains the app source of truth.
- Preserve server-only Unsplash secrets.
- Keep client API calls path-aware.
- Keep export/share/Markdown output aligned with active app state.
- Use local UI primitives before adding new component patterns.
- Run pnpm lint and pnpm build; add browser or visual checks when UI behavior changes.

## Escalation Status

deferred

Napoleon owns SKILL.md authoring. This repo-local request preserves the context until MDS routes that authoring work.

## Completion Definition

A repo-local SKILL.md exists, is listed under .repo/skills/MANIFEST.md metadata.config.skills, and gives future agents required reading plus verification gates for Color Shift app changes.
