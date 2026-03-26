# Photo Transition Options

All use an 8x8 (or configurable NxN) grid of cells. Each cell clips a piece of the photo using `overflow: hidden` + positioned inner image. GSAP timeline with stagger handles the sequencing.

## Implementation Pattern

```
Container (relative, overflow hidden)
  └── Grid of N*N cells (absolute, each clips its photo region)
       └── Full photo image (positioned so the visible portion aligns)
```

Each cell knows its row/col and positions its inner image at `-col * cellW, -row * cellH` so only that cell's region shows. GSAP animates each cell's entry.

---

## 1. Staggered Reveal

Cells of the new photo scale up from 0 with stagger. The old photo sits behind and is progressively covered.

```
gsap.from(cells, {
  scale: 0,
  opacity: 0,
  duration: 0.4,
  stagger: { amount: 0.5, from: 'random' }, // or 'center', 'edges', index
  ease: 'back.out(1.7)',
});
```

Stagger patterns: `'random'`, `'center'`, `'edges'`, `'start'` (top-left wave), `'end'` (bottom-right wave), or a custom grid stagger.

---

## 2. Sliding Tiles

Each cell slides in from a random direction (left, right, top, bottom). Creates a shattered-glass-reassembling effect.

```
cells.forEach(cell => {
  const dir = randomDirection(); // {x: -100, y: 0} etc.
  gsap.from(cell, {
    x: dir.x + '%',
    y: dir.y + '%',
    opacity: 0,
    duration: 0.5,
    ease: 'power3.out',
  });
});
```

With stagger: tiles slide in wave-like from one side.

---

## 3. Diagonal Wipe

Cells reveal along a diagonal wave. Each cell's delay is based on `(row + col)` so the wave moves corner to corner.

```
gsap.from(cells, {
  scale: 0,
  duration: 0.3,
  stagger: {
    each: 0.03,
    grid: [8, 8],
    from: 'start', // top-left corner
    axis: null, // diagonal
  },
  ease: 'power2.out',
});
```

---

## 4. Mosaic Flip (3D)

Each cell rotates 180deg on Y axis. Photo A on the front face, photo B on the back. Requires `perspective` on parent and `backface-visibility: hidden` on both faces.

```
gsap.to(cells, {
  rotationY: 180,
  duration: 0.6,
  stagger: { amount: 0.8, from: 'random' },
  ease: 'power2.inOut',
});
```

---

## 5. Blinds (Horizontal Strips)

Full-width horizontal strips flip down to reveal the new photo. Like window blinds opening.

```
// Use N horizontal strips instead of NxN grid
gsap.from(strips, {
  scaleY: 0,
  transformOrigin: 'top',
  duration: 0.4,
  stagger: 0.05,
  ease: 'power2.out',
});
```

---

## 6. Spiral Reveal

Cells reveal in a clockwise spiral from the outside edge inward (or center outward).

```
// Pre-compute spiral order indices
const spiralOrder = computeSpiralOrder(8, 8);
cells.forEach((cell, i) => {
  gsap.from(cell, {
    scale: 0,
    opacity: 0,
    duration: 0.3,
    delay: spiralOrder[i] * 0.02,
    ease: 'power2.out',
  });
});
```

---

## 7. Pixel Rain

Cells drop in from the top, column by column with slight per-row stagger. Like rain filling the image.

```
gsap.from(cells, {
  y: '-100%',
  opacity: 0,
  duration: 0.4,
  stagger: {
    each: 0.02,
    grid: [8, 8],
    from: 'start',
    axis: 'x', // column-first
  },
  ease: 'bounce.out',
});
```

---

## 8. Scatter & Gather

Photo A cells scatter outward (scale down + random offset). Photo B cells gather inward from scattered positions. Two-phase timeline.

```
const tl = gsap.timeline();
tl.to(cellsA, {
  scale: 0.5,
  x: 'random(-200, 200)',
  y: 'random(-200, 200)',
  opacity: 0,
  duration: 0.3,
  stagger: { amount: 0.2, from: 'center' },
  ease: 'power2.in',
})
.from(cellsB, {
  scale: 0.5,
  x: 'random(-200, 200)',
  y: 'random(-200, 200)',
  opacity: 0,
  duration: 0.4,
  stagger: { amount: 0.3, from: 'edges' },
  ease: 'power3.out',
}, '-=0.1');
```

---

## 9. Color-First Reveal (Current Pixel Scramble, Enhanced)

Keep the canvas pixel approach but add a second phase: after pixels swap colors, the grid cells progressively reveal the full-res photo underneath. Hybrid canvas → DOM transition.

---

## Notes

- All grid transitions need the photo pre-loaded before starting
- GSAP `stagger.grid` is purpose-built for this: `stagger: { grid: [rows, cols], from: 'center', amount: 0.6 }`
- `will-change: transform` on cells during animation, remove after
- Use `gsap.context()` for cleanup on unmount
- `prefers-reduced-motion`: skip to instant swap
- Could expose a transition picker in the UI (dropdown or keyboard shortcut to cycle)
- The 8x8 grid = 64 DOM elements per transition. Lightweight.
