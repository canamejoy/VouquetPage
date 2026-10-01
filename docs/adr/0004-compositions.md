# ADR 0004: Compositions

Status: accepted (slice 7, composition core). The six templates arrive in slices 8 and 9.

## Context

A composition arranges the flowers and foliage the user already chose. It must be deterministic,
visibly distinct from the other compositions, and produce an ordinary bouquet the user keeps
editing. The layout must stay inside the model bounds for every item count from 1 to 60.

## Decision

- A composition is a layout rule over a list of items, not a recipe that discards the user's items.
  The only seam is `CompositionGenerator`: `({ items, catalog, seed }) => ElementPlacement[]`.
  A generator returns exactly one placement per input item, back to front, without ids.
- Each registry entry (slice 9) is `{ id, seed, defaultItems, generate }`, typed here as
  `CompositionTemplate`. `applyComposition(bouquet, template, catalog)` lives in `domain/bouquet`.
- `applyComposition` replaces the flower and foliage elements with the generator's placements,
  assigns ids `e1..eN` in output order, keeps `wrappingId`, drops any placement beyond the number of
  items it received, and clamps anchors to the model bounds as a last guard.
- A bouquet is empty for compositions when it has no flower or foliage elements. A wrapping-only
  bouquet counts as empty and receives the template's default items. The inline confirmation is a
  UI concern and is not part of the domain function.
- Determinism comes from `mulberry32(seed)` in `domain/composition/rng.ts`. The seed is an argument,
  `Math.random` is banned in `domain` by ESLint, and generators round anchors and rotations to
  integers and scale to two decimals (`rounding.ts`) so output is identical on every platform.
- Shared mechanics live in helpers so each template only chooses numbers:
  - `canonicalItems`: flowers by descending catalog area, then catalog order, then colour order,
    then original order (the first flower is the focal one); foliage by catalog order, then original.
  - `rings.ts`: slot 0 plus rings `1..K` (ring `k` holds up to `6k` slots at radius `k * d`),
    foliage on whole rings `K+1..T`, spacing `d = min(dMax, rLimit / max(T, 1))`, scale
    `max(0.4, factor * d / dMax)`. `K = 0` for one flower or none.
  - `lanes.ts`: up to three lanes 70 units apart, centred on a quadratic Bezier, items spread
    over steps in a range; a single step sits at the range midpoint.
- Layout rules are derived so anchors stay inside the bounds without relying on the clamp.

## Alternatives

- `Math.random`: not reproducible, so determinism tests and shared layouts would be impossible.
- A PRNG package: mulberry32 is a dozen lines.
- Fixed recipes with fixed item counts: they would discard the items the user chose.
- Async generators, scoring, an optimizer or a plugin registry: nothing in the MVP needs them.
- Placing ids inside generators: ids belong to the bouquet and depend on its other elements.

## Consequences

- Every template is a pure function that tests can call with a catalog and a seed.
- At high item counts some layouts overlap; the result stays inside the bounds and fully editable.
- Adding a template means one generator and one registry entry; no other module changes.
