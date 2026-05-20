# Color Shift

Single-page color contrast tool for exploring foreground/background pairs against Unsplash photos. Built with Next.js 16, React 19, Tailwind v4, culori, APCA/WCAG scoring, GSAP motion, and browser-side photo palette extraction.

## Commands

pnpm install
pnpm dev
pnpm lint
pnpm build

## Environment

UNSPLASH_ACCESS_KEY=<unsplash-api-key>

## Share Links

Color Shift supports deep links with query parameters:

/?photo=<unsplashId>&bg=<hex>&fg=<hex>&algo=wcag

- `photo` is an Unsplash photo ID.
- `bg` and `fg` are hex colors with or without `#`.
- `algo` accepts `wcag` or `apca`.

The export panel can copy the full URL, copy just the parameters, or download a Markdown export.
