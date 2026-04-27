## Why text feels small & why the page doesn't fill the screen

I looked at your homepage code and the global styles. Both issues are real and have clean fixes.

### 1. Why the fonts feel small

Most body copy on the homepage uses Tailwind's `text-sm` (14px) or `text-xs` (12px) — for example testimonials, FAQ answers, the session cards, the "$280" line, and the small CTA captions. That's noticeably below the 16–17px most modern sites use for body text. Headings are fine; it's the supporting copy that's the problem.

### 2. Why the desktop layout doesn't take the full width

Two reasons stack together:

- Every section is wrapped in `container mx-auto max-w-6xl` (or `max-w-4xl`, `max-w-3xl`, `max-w-2xl`). `max-w-6xl` = 1152px. Tailwind's `container` is also capped at 1400px at the `2xl` breakpoint. So even on a big monitor, content stops well before the edges.
- A leftover `src/App.css` exists with `#root { max-width: 1280px; padding: 2rem; text-align: center; }`. It is **not** currently imported (so it isn't actually constraining anything today), but it's misleading dead code I'll remove so it doesn't accidentally get pulled back in.

A little side margin on desktop is normal and good for readability — but right now the cap is conservative and the visual breathing room feels excessive on wider screens.

---

## Proposed fixes

### A. Bump up readable text size globally

Set the `body` base size to ~17px in `src/index.css` so every `text-sm`, `text-base`, etc. scales up together. This is the single highest-impact change — you don't have to hunt through every page.

```css
/* src/index.css — inside @layer base { body { ... } } */
body {
  @apply bg-background text-foreground;
  font-family: var(--font-body);
  font-size: 17px;       /* was browser default 16px */
  line-height: 1.6;
}
```

Then on the homepage I'll lift the smallest copy a notch where it matters most:
- Testimonial body: `text-sm` → `text-base`
- FAQ answers: keep `text-base` (currently inherits, will now be 17px)
- Session card venue line: `text-xs` → `text-sm`
- Pricing line ($280): `text-sm` → `text-base`
- Footer + nav links in `Layout.tsx`: bump `text-sm` → `text-base` on desktop

### B. Widen the desktop layout

Two-part change:
1. Raise the Tailwind container cap from 1400px to 1600px in `tailwind.config.ts` so wide monitors get more usable space.
2. On the homepage, change the main sections from `max-w-6xl` (1152px) → `max-w-7xl` (1280px). I'll leave the FAQ at `max-w-3xl` and the newsletter card at `max-w-2xl` because narrow text columns are easier to read — widening those would actually hurt readability.

### C. Clean up dead CSS

Delete `src/App.css` since it isn't imported and its rules (`max-width: 1280px`, `text-align: center`, `padding: 2rem`) would conflict with the layout if anyone re-added the import.

---

## Files I'll touch

- `src/index.css` — set body font-size to 17px and line-height 1.6
- `tailwind.config.ts` — bump `2xl` container screen from 1400px to 1600px
- `src/pages/Index.tsx` — widen sections to `max-w-7xl`, bump small text on testimonials/cards/pricing
- `src/components/Layout.tsx` — slightly larger nav + footer text on desktop
- `src/App.css` — delete (unused)

## What I'll leave alone

- Headings — already well-sized
- FAQ text column and newsletter card — staying narrow on purpose for readability
- Color, brand voice, and overall layout structure

After this, body copy will feel comfortably readable (closer to what you'd expect on a polished site), and the homepage will use noticeably more of the screen on desktops without sprawling so wide it becomes hard to scan.
