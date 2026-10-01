# ADR 0003: Catalog and illustrations

Status: accepted (slice 13, flower art; foliage and wrappings follow in later slices).

## Context

The editor needs 18 catalog illustrations that can be selected and hit-tested precisely, drawn in
one consistent style, and recoloured per flower colour. The product must read as a design tool,
not a generic flower shop, so the art is part of the deliverable. No third-party artwork may be used.

## Decision

- Each illustration is a hand-authored inline TSX component returning a `<g aria-hidden="true">`,
  centred on `(0, 0)` and inside its catalog `size`. Accessible names come from the canvas element
  that wraps it. Components are keyed by catalog id in a typed registry
  (`Record<FlowerId, ComponentType>` for flowers), so a missing illustration is a compile error.
  The domain catalog holds no asset reference.
- Recolourable flowers paint with `fill="currentColor"`; the canvas sets `color` on the wrapper from
  `COLOR_HEX`. Depth comes from fixed translucent black and white overlays (shade, deep and
  highlight in `flowers/paint.ts`), so one hex drives the whole flower and white keeps its structure.
  Fixed-colour flowers (sunflower, lavender) hard-code their own hex fills.
- Repeated petals come from small pure path builders (`flowers/paths.ts`) that emit absolute
  commands and one path per ring, which keeps each flower near 12 shapes and its extent checkable. `ruffle` (uneven lobes, peony) and `fringedRing` (petals with a fringed edge, carnation) are deterministic, so the art never changes between renders. The carnation uses 13 shapes (test bound 14) because recognizing it needs three fringed tiers plus shading; D3 says "about 12".
- The art is agent-authored. Replacing a flower means replacing its component and registry entry;
  nothing else changes.

## Alternatives rejected

`.svg` files through `<image>` (cannot be recoloured), SVGR (build plugin for little gain),
raster or third-party packs (not recolourable, licence review).

## Consequences

- No dependency and no asset pipeline; tests can check structure, colour mechanism and bounds,
  but not beauty. Visual quality needs a human look in the browser.
- Each petal tier is shaded darker at its base and lighter at its edge instead of outlined, so petals read as overlapping volumes; the faint `SOFT` shade keeps white flowers readable.
- Overlay shading is uniform across colours, so very dark colours (burgundy) show less depth.
