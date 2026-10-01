# ADR 0001: SVG renderer and Pointer Events

Status: accepted (slice 17, canvas render).

## Context

The editor shows tens of elements that the user moves, rotates and scales on touch and mouse.
The scene must be testable under Strict TDD in jsdom, readable by assistive technology, and sharp
at any size. The art is vector, and the model (`Bouquet`) is the single source of truth.

## Decision

Render the scene as one inline SVG and drive it with Pointer Events. Draw order, back to front:
background, wrapping back, stems, wrapping front, elements in array order, selection overlay.
Stems are derived from each anchor to the binding point and never stored. Elements stay above the
wrapping front so every element remains visible and selectable. The wrapping ignores pointer events.

| Option                      | Tradeoff                                                                                                       | Outcome       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------- |
| Inline SVG + Pointer Events | Handles are hand-built; real DOM for jsdom tests and accessibility; crisp vector art; no dependency            | Chosen        |
| Konva + react-konva         | Free `Transformer`; canvas is opaque to jsdom and assistive tech, art must be rasterized, peer-locked to React | Fallback only |
| Fabric.js                   | Rich editor, but heavy, imperative, and its object model competes with `Bouquet`                               | Rejected      |
| Raw Canvas 2D               | No dependency, but hit testing and handles must be rebuilt with no test benefit                                | Rejected      |
| Pixi, tldraw                | Game engine or heavy SDK with unverified licensing                                                             | Rejected      |

## Consequences

- `EditorCanvas` is presentational: it receives the bouquet, catalog, selection and
  `modelPerPixel` as props and reads only the i18n Context.
- Each element is a focusable `role="button"` with a localized name; selection handles keep a
  constant on-screen size through `modelPerPixel`.
- Hand-built handles and gestures are our code to maintain. If they prove too costly, Konva is the
  documented fallback; the change touches `ui/organisms/EditorCanvas` and `ui/illustrations` only.

## Gestures and jsdom limits (slice 18)

`useTransformGesture` captures the pointer on the svg, not on the pressed node, because the scale
handles re-render (and remount) as the scale changes. Presses in the letterbox land on the svg itself,
so the svg also deselects. The canvas sets `touch-action: none`.

jsdom 30 re-checked: `PointerEvent` carries `pointerId`, `clientX` and `clientY`, but `setPointerCapture`,
`hasPointerCapture` and `releasePointerCapture` are still missing, so the stub in `src/test/setup.ts`
stays. `ResizeObserver` is also missing and `getBoundingClientRect` returns zeros: the container skips
observation when it is absent and tests stub the rect. Real touch scrolling, real pointer capture and
layout are not verifiable in jsdom (user action U4).
