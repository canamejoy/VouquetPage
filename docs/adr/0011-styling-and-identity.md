# ADR 0011: Styling and visual identity

Status: accepted (slice 16, tokens and atoms).

## Context

VOUQUET should read as an elegant design tool, not a generic flower shop, and it must stay
legible on a 360 px phone and on a desktop. The illustrations sit on a warm cream canvas, so the
interface needs a quiet, paper-like frame that lets the flowers carry the colour.

## Decision

- Styling is CSS Modules plus custom properties in `src/ui/styles/tokens.css`; `base.css` holds
  the few global rules (box sizing, body, headings, `:focus-visible`). No styling, font or icon
  dependency.
- Palette: paper `#F6F3EE`, surface `#FFFFFF`, ink `#1E1B18`, muted `#6F6A64`, accent botanical
  green `#2F4A3C`, danger `#A63D2F`. The serif stack (Georgia first) is for the wordmark and
  headings; controls use the system sans stack. No web fonts.
- Icons are hand-authored inline SVG, 24 px, 1.5 px stroke, `aria-hidden`; the button carries
  the localized name (`IconButton` uses `toolbar.<icon>`).
- Controls are native `<button>` elements with a 44 px minimum target (`--size-target`) and one
  focus ring (`--focus-ring-*`, 2 px accent outline with a 2 px offset).
- `--motion-duration` is 150 ms and becomes 0 ms under `prefers-reduced-motion: reduce`.

Contrast, computed by `tokens.test.ts` from the real file (WCAG 2.x ratios):

| Pair                               | On paper | On surface | Needed                        |
| ---------------------------------- | -------- | ---------- | ----------------------------- |
| ink                                | 15.49    | 17.14      | 4.5 (text)                    |
| muted                              | 4.84     | 5.36       | 4.5 (text)                    |
| accent                             | 8.76     | 9.70       | 4.5 (text) and 3 (focus ring) |
| danger                             | 5.70     | 6.31       | 4.5 (text)                    |
| border-control `#857F77`           | 3.58     | 3.96       | 3 (control boundary)          |
| surface on accent (primary button) | 9.70     | n/a        | 4.5                           |
| surface on danger                  | 6.31     | n/a        | 4.5                           |

The design's hairline `#E3DED6` measures 1.21 on paper and 1.34 on surface, which fails the 3:1
needed to see a control boundary. It is kept for decorative dividers only, and control borders use
the added `--color-border-control` (`#857F77`).

## Alternatives

- Tailwind or CSS-in-JS: rejected as dependencies for a small interface.
- Global CSS only: rejected for selector collisions.
- An icon library or web fonts: rejected for bundle weight and for a distinctive look.

## Consequences

- Components own their CSS Module and read only tokens, so the identity changes in one file.
- jsdom applies no stylesheets, so tests cover semantics (role, name, state) and the token
  contrast numbers; layout is checked in the browser. Vitest is configured to load `tokens.css`
  as text for that test only.
