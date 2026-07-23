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
- `swap=1` puts the lighter color in the background slot (polarity otherwise defaults dark-background and will flip a light bg/fg pair).
- `text` sets the specimen text.
- `size` pins the specimen font size in px (embed use; auto-fit otherwise).
- `layout=stacked` pins the vertical color-over-photo card at every viewport width (embed use).
- `display=1` locks the app into a controls-free showcase.

The export panel can copy the full URL, copy just the parameters, or download a Markdown export.
