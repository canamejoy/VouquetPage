# ADR 0002: Bouquet model

Status: accepted (slice 4, bouquet operations)

## Context

The editor, the summary and the draft all need one description of a bouquet that does not depend
on how it is drawn. Depth, element identity, limits and quantities must have a single source of
truth so the reducer, the renderer and the pricing code cannot disagree.

## Decision

- A bouquet is `{ schemaVersion: 1, elements, wrappingId }`. `elements` holds flowers and
  foliage in one list with a `kind` discriminant; only flowers carry `colorId`.
- Array order is depth, index 0 is the back. There is no `layer` field.
- The wrapping is a catalog id (or `null`) with no position, rotation, scale or layer. Setting
  it replaces the previous one; clearing it leaves the elements unchanged.
- Positions are the element anchor in model units (x -500 to 500, y -1000 to 300, y down) and
  every operation clamps them. Rotation is degrees in `[0, 360)`. Scale is clamped to
  `[0.4, 2.5]`. `Point`, the bounds and the scale limits come from `domain/geometry`.
- At most 60 elements. Add and duplicate return the same bouquet value at the limit.
- Ids are `e{n}`, assigned by the domain as the highest existing suffix plus one, so the reducer
  stays pure (no random or time source).
- Every operation is a pure function returning a new bouquet, or the same reference when the
  operation is a no-op (unknown id, limit, bad colour, ends of the order).
- Quantities are derived by counting elements per `(catalogId, colorId)` and never stored.
- `metadata`, `variant` and a `decoration` kind are omitted: no MVP feature reads them.

## Alternatives

- Separate arrays per kind: z-order could not interleave flowers and foliage.
- A `layer` number: a second source of truth to keep in sync with the list order.
- Wrapping as a list entry: four meaningless fields and no single depth.
- `crypto.randomUUID()` ids: makes the reducer impure and drafts harder to read.
- A stored `quantity` field: two representations of the same fact.

## Consequences

- Returning the same reference for no-ops lets callers detect them with `===`.
- Ids are never reused within a bouquet unless the highest-numbered element is deleted; this is
  acceptable because ids are bouquet-local and only used for selection.
- `parseBouquet` (next slice) must enforce the same invariants for stored drafts.
