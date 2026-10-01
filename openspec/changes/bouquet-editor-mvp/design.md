# Design: Bouquet Editor MVP

## Technical Approach

A React 19 single-page app that renders the bouquet as inline SVG and edits it through Pointer Events. All behaviour lives in pure TypeScript (`domain`, `application`) and is written test-first; React components only render state and forward input. The only runtime dependencies are `react` and `react-dom`. Hosting is a Cloudflare assets-only Worker built from GitHub.

### Decisions at a glance

| # | Topic | Decision |
|---|-------|----------|
| D1 | Rendering | Inline SVG + Pointer Events, hand-built handles over pure geometry functions |
| D2 | Model | One ordered `elements[]` (flowers and foliage) plus `wrappingId`; model units, origin at the binding point, quantity derived |
| D3 | Catalog | Static typed module; art as inline TSX SVG components keyed by catalog id |
| D4 | Compositions | Six pure layout generators over the bouquet's own items, one `CompositionGenerator` type, seeded mulberry32, integer output |
| D5 | State | Pure reducer + Context; four layers with a lint-enforced dependency rule |
| D6 | Pricing | Integer whole COP; USD total in cents = `floor((cop + 17) / 34)` (round half up); lines allocated by largest remainder so they always sum to the total |
| D7 | Localization | Typed dictionary, no library |
| D8 | Draft | One localStorage key, debounced autosave, all-or-nothing validation |
| D9 | UI | Three-panel desktop, canvas-first below 1024 px, docked two-row selection toolbar, CSS Modules + tokens |
| D10 | Testing | Vitest + Testing Library + jsdom; `npm run check` |
| D11 | Deployment | Workers static assets via Workers Builds; no Cloudflare secret in GitHub |
| D12 | Docs | README + 11 short ADRs |

## Architecture Decisions

### D1. 2D rendering and interaction

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline SVG + Pointer Events | Handles are hand-built; renders in jsdom, real DOM for accessibility, crisp vector art, zero dependency | **Chosen** |
| Konva + react-konva | Free `Transformer`; canvas is opaque to jsdom and assistive tech, SVG art must be rasterized, peer-locked to the React minor | Fallback only |
| Fabric.js 7 | Rich editor; heaviest, imperative, own object model competes with `Bouquet` | Rejected |
| Raw Canvas 2D | No dependency; reimplements hit testing and handles with no test benefit | Rejected |
| Pixi, tldraw | Game engine / heavy SDK with unverified licensing | Rejected |

Rationale: the scene is tens of elements, so canvas throughput is irrelevant, while Strict TDD and accessibility both require a queryable DOM.

**Renderer boundary.** `EditorCanvas` is presentational: props are `bouquet`, `catalog`, `selectedId`, `modelPerPixel` and callbacks. It reads no editor or preferences state. It builds each element's accessible label itself with `useT()` from the catalog id, colour id and layer index (see the i18n rule in D5). Replacing the renderer touches `ui/organisms/EditorCanvas` and `ui/illustrations` only.

**Draw order (back to front):** background rect, wrapping back panel, stems, wrapping front panel, elements in array order, selection overlay. Stems are derived by the renderer as a curve from each element anchor to the origin; they are not stored. Elements stay above the wrapping front panel so every element remains visible and selectable (editability over realism). The wrapping has `pointer-events: none` and is not selectable on the canvas.

**Handles.** The overlay draws the element frame (`size x scale`, rotated), four corner scale handles (uniform scale) and one rotate handle above the top edge. Visible size 12 px, hit target 44 px, both converted with `modelPerPixel`. Dragging the element body moves it.

**Pointer path.**

1. `pointerdown` on an element body or handle selects it, calls `setPointerCapture`, and `useTransformGesture` stores the gesture start in a ref.
2. Each `pointermove` converts the client point with `clientToModel`, calls the matching pure function and dispatches `element/transform`.
3. `pointerup` or `pointercancel` ends the gesture.
4. `pointerdown` on the background rect (empty canvas) dispatches `element/select` with `null`: nothing is selected and the handles disappear.

The container measures the SVG rect (`ResizeObserver`) and passes it down, so no geometry function reads layout. The canvas sets `touch-action: none`, so touch never scrolls the page.

**Adding from the palette** uses one pointer path for mouse and touch.

| Input | Result |
|-------|--------|
| Press and release without moving more than 8 px (tap or click) | Adds at the default anchor: `(0, -540)` plus a golden-angle offset `r = 34 * sqrt(k)`, `theta = k * 137.508 deg`, `k = element count mod 24`. The offset is at most 163 units, so the default anchor is always inside the bounds |
| Press and move more than 8 px | Starts a drag with a ghost preview |
| Release inside the SVG | Adds with the anchor at the pointer, clamped to the model bounds |
| Release outside the SVG | Adds nothing |
| `pointercancel` (or `Escape`) | Cancels the drag; adds nothing |

Palette items use `touch-action` on the scroll axis only, so the perpendicular drag reaches Pointer Events. The ghost preview is a UX extra beyond the spec.

Not built: pinch gestures, rotation snapping, multi-select, marquee selection, zoom and pan.

### D2. Bouquet model

A bouquet is an ordered list of elements (flowers and foliage) plus at most one wrapping chosen by catalog item.

| Aspect | Decision | Rejected alternative |
|--------|----------|----------------------|
| Structure | One `elements[]` with a `kind` discriminant (`flower`, `foliage`) plus `wrappingId` | Separate arrays per kind: z-order cannot interleave kinds |
| Wrapping | `wrappingId: WrappingId \| null`. It has no position, rotation, scale or layer and is not selectable. Setting it replaces the previous one; clearing it leaves `elements` unchanged | Wrapping as a list entry: four meaningless fields and no single depth (it draws as a back and a front panel) |
| Depth | Array order, index 0 is the back | `layer` number: second source of truth to keep in sync |
| Units | Model units, independent of pixels | Screen pixels: breaks responsive layouts |
| Space | Origin `(0, 0)` is the binding point; x right, y down; bounds x `[-500, 500]`, y `[-1000, 300]`; viewBox `-500 -1000 1000 1300` | y-up: would require a flip in the only renderer |
| Position | The element **anchor** (bloom or sprig centre). Every operation clamps the anchor to the bounds; the bounds apply to the anchor, so artwork may extend past them and is clipped by the SVG | |
| Rotation | Degrees, clockwise, normalized to `[0, 360)`, about the anchor; art is authored pointing up | Radians: unreadable in stored drafts |
| Scale | Uniform multiplier, 1 is catalog size, clamped to `[0.4, 2.5]` | Non-uniform: distorts illustrations |
| Quantity | Derived by counting elements per `(catalogId, colorId)`; each element is one stem | `quantity` field: two representations of the same fact |
| Ids | Bouquet-local `e{n}` (`/^e[1-9]\d*$/`), assigned by the domain as max suffix + 1 | `crypto.randomUUID()`: makes the reducer impure |
| Limit | `MAX_ELEMENTS = 60` flower and foliage elements. Add and duplicate leave the bouquet unchanged at the limit | Unbounded: unbounded draft size and SVG node count |
| Version | `schemaVersion: 1`, no migration framework | |

`kind` is kept because it changes the shape: only flowers carry `colorId`.

**Validation at load.** `parseBouquet(raw: unknown, catalog): Bouquet | null` is hand-written and all-or-nothing. It returns `null` unless: the version is 1; there are at most 60 elements; every id matches `e{n}` and is unique; every `catalogId` exists with the matching kind; numbers are finite, anchors are inside the bounds, scale is inside its clamp and rotation is in `[0, 360)`; `colorId` belongs to the flower (or is `null` for a fixed-colour flower); `wrappingId` is `null` or known. Zod was rejected: one schema does not justify a dependency.

**Omitted on purpose.** `metadata`, `variant` and the `decoration` kind from the user's conceptual model are left out because no MVP feature reads them (colour is carried by `colorId`); this omission was reported to the user. Also absent: `z`, 3D rotation, stem geometry, element groups, any AI or import interface.

### D3. Catalog

Static typed module in `domain/catalog`; no fetch and no repository interface. Display names come from the dictionary (`catalog.<id>`, `color.<id>`), so the domain holds no copy. `colors: []` means fixed colour; this is the single representation of "not recolorable". A recolourable flower lists at least two colours and the first one is its default. Recolouring to a colour outside the list leaves the element unchanged.

| Kind | Id | Colours | Size (w x h) | Sample price (COP) |
|------|----|---------|--------------|--------------------|
| flower | `rose` | red, blush, white, peach, burgundy | 150 x 150 | 6000 |
| flower | `tulip` | red, yellow, pink, white, purple | 110 x 150 | 5000 |
| flower | `peony` | blush, coral, white | 190 x 190 | 12000 |
| flower | `carnation` | red, pink, white | 130 x 130 | 3000 |
| flower | `gerbera` | orange, pink, yellow, red | 160 x 160 | 4500 |
| flower | `lily` | white, pink, orange | 180 x 180 | 9000 |
| flower | `sunflower` | none (fixed) | 200 x 200 | 7000 |
| flower | `lavender` | none (fixed) | 60 x 220 | 3500 |
| foliage | `eucalyptus` | - | 160 x 260 | 3000 |
| foliage | `ruscus` | - | 120 x 260 | 2500 |
| foliage | `fern` | - | 180 x 280 | 2000 |
| foliage | `olive` | - | 130 x 250 | 3500 |
| foliage | `dusty-miller` | - | 170 x 190 | 3000 |
| wrapping | `kraft`, `ivory`, `blush`, `charcoal`, `burlap` | - | - | 4000, 5000, 7000, 7000, 6000 |

Colour hex values are defined once: red `#B3262E`, blush `#E8B7B9`, white `#F7F2EA`, peach `#F2B58C`, burgundy `#6E1F2E`, yellow `#EDC84A`, pink `#DE7FA0`, purple `#7E5AA6`, coral `#EE7A62`, orange `#E88A2E`.

**Illustrations**

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline TSX components returning `<g>` | No dependency, recolorable, pixel-accurate hit testing, testable | **Chosen** |
| `.svg` files through `<image>` | Cannot be recoloured; bounding-box hit testing | Rejected |
| `.svg` files + SVGR | Adds a build plugin for 18 files | Rejected |
| Raster or third-party packs | Not recolourable; licence review | Rejected |

Each illustration lives in `ui/illustrations/`, is centred on `(0, 0)` inside its catalog size, and uses at most about 12 shapes. Recolourable flowers paint with `fill="currentColor"` and get shade and highlight from fixed translucent overlays, so one hex drives the whole flower; fixed flowers hard-code fills. Wrappings export `Back` and `Front` parts. `illustrationRegistry` is typed `Record<CatalogId, ...>`, so a missing illustration is a compile error. The domain catalog has no asset field.

### D4. Compositions

A composition is a **layout rule over a list of items**: it arranges the bouquet's current flowers and foliage. A bouquet is **empty for compositions when it has no flower or foliage elements** (a wrapping-only bouquet counts as empty); only then is the template's default item set used.

```ts
type ItemRef = { kind: 'flower'; catalogId: FlowerId; colorId: ColorId | null } | { kind: 'foliage'; catalogId: FoliageId };
type ElementPlacement = Omit<FlowerElement, 'id'> | Omit<FoliageElement, 'id'>;
type CompositionGenerator = (input: { items: readonly ItemRef[]; catalog: Catalog; seed: number }) => ElementPlacement[];
```

This type is the only seam. Each registry entry is `{ id, seed, defaultItems, generate }`.

- A generator returns exactly one placement per input item (same catalog ids and colours), so applying a composition never produces more elements than it received. Generators do not assign ids.
- `applyComposition` in `domain/bouquet` replaces `elements`, assigns ids `e1..eN` in output order, and keeps `wrappingId`. The reducer clears the selection.
- Applying to a bouquet that has flowers or foliage requires an inline confirmation (D9); an empty bouquet needs none.

Rejected: `Math.random` (not reproducible), a PRNG package (eight lines replace it), fixed recipes that discard the user's items, async generators, scoring, plugin registries.

**Shared rules**

- Bloom centre `C = (0, -540)`; angle 0 is up, clockwise; default rotation points away from the origin. `n` is the flower count, `m` the foliage count, `n + m <= 60`.
- **Canonical order.** Flowers are sorted by descending catalog area (`size.width * size.height`), then catalog order, then colour order within the flower's `colors`, then original bouquet order. The first flower is the focal one. Foliage keeps catalog order, then bouquet order.
- Output order is back to front: foliage first, then flowers from outermost to focal.
- **Ring slots** around a centre. Flowers take slot 0 (the centre) and then rings `1..K`; ring `k` holds up to `6k` slots at radius `k * d`. `K = 0` when `n <= 1`. Foliage, where the template says so, takes whole rings `K+1..T` (never slot 0, never a ring shared with flowers). A partly filled ring spreads its actual count evenly, starting at 0 deg on odd rings and at half a step on even rings. Spacing is `d = min(dMax, rLimit / max(T, 1))`, so `n = 1` gives `d = dMax` with no division by zero. Element scale is `max(0.4, factor * d / dMax)`; the 0.4 floor applies after the template factor.
- **Lanes** along a quadratic Bezier with `c` items over a range `[t0, t1]`: `L = min(3, ceil(c / 6))` lanes 70 units apart, centred on the curve, so lane `l` has perpendicular offset `(l - (L - 1) / 2) * 70`. Item `j` uses lane `j mod L` at step `s = floor(j / L)` of `S = ceil(c / L)` steps, `t = t0 + (t1 - t0) * s / (S - 1)`; when `S = 1`, `t = (t0 + t1) / 2`.
- Rules are derived so that every anchor is inside the model bounds for every count from 1 to 60 **without relying on the clamp**. The clamp is still applied last as a guard.

| Template | Flowers | Foliage | PRNG |
|----------|---------|---------|------|
| Round | Ring slots around `C`, `dMax = 145`, `rLimit = 440`, factor 1 | Rings `K+1..T` of the same slot system | none |
| Compact | Ring slots around `C`, `dMax = 115`, `rLimit = 300`, factor 0.8 | Rings `K+1..T` of the same slot system | none |
| Asymmetric | Focal point `F = (-110, -480)`. Focal flowers: the first `min(n, 3)`; one sits at `F`, two at `F + (-60, 0)` and `F + (60, 0)`, three on a triangle of radius 90 at 0, 120, 240 deg. Of the rest, two thirds (rounded up) go on the long arm `F -> (120, -740) -> (320, -860)`, range `[0.3, 1]`, scale `1 - 0.35t`; the remainder on the short arm `F -> (-260, -520) -> (-330, -380)`, range `[0.5, 1]`, scale 0.9. Lanes on both | Two thirds (rounded up) on the long arm, the rest on the short arm, same ranges, single file, alternating perpendicular offsets `+120` and `-120` | anchor +-10, rotation +-8 deg |
| Wild | One phyllotaxis spiral over all items: `r = c * sqrt(i + 0.5)`, `theta = i * 137.508 deg`, `c = min(76, 430 / sqrt(n + m))`. Flowers take indices `0..n-1` after a seeded Fisher-Yates shuffle of the canonical order | Indices `n..n+m-1` of the same spiral, shuffled the same way | anchor +-26, scale x 0.75-1.15, rotation +-25 deg |
| Long stems | Seven columns filled centre-out (`k = 0, +1, -1, +2, -2, +3, -3`), then a new row. `R = ceil(n / 7)` rows, `rowStep = min(130, 545 / max(R - 1, 1))`. `x = 62k`, `y = -900 + 70 * abs(k) + (abs(k) odd ? 45 : 0) + rowStep * row`, rotation `6k` deg | Alternating sides, `g = floor(j / 2) mod 3`, tier `q = floor(j / 6)`, `Q = ceil(m / 6)`, `tierStep = min(120, 500 / max(Q - 1, 1))`: `x = side * (110 + 105g)`, `y = -620 + 100g + tierStep * q`, rotation `side * (18 + 12g)` deg | none |
| Cascade | Dome: 60% (rounded up) on ring slots around `D = (-40, -610)`, `dMax = 150`, `rLimit = 300`, flowers only. Trail: the rest on `(110, -480) -> (300, -300) -> (320, 140)`, range `[0, 1]`, scale 0.95 down to 0.6, lanes | Half (rounded up) as a fan behind the dome, evenly over -60 to +60 deg (a single sprig at 0 deg), radius `min(K * d + 100, 380)`. The rest single file on `(140, -420) -> (330, -220) -> (330, 240)`, range `[0.2, 1]`, rotated to the tangent | anchor +-8 |

**Bounds check, 1 to 60 items.** From `C`, the bounds allow 460 units up and 500 sideways.

| Template | Worst case | Envelope of anchors | Inside bounds |
|----------|-----------|---------------------|---------------|
| Round | `T = 5` rings (for example 20 flowers and 40 foliage) gives `d = 88`, outer radius 440 | within 440 of `C`: y >= -980, abs(x) <= 440 | Yes |
| Compact | `T = 5` gives `d = 60`, outer radius 300, scale `max(0.4, 0.8 * 60 / 115) = 0.42` | within 300 of `C` | Yes |
| Asymmetric | 3 lanes and foliage offsets at the long-arm end | x in `[-447, 392]`, y >= -973 including jitter | Yes |
| Wild | Spiral radius below 430 plus jitter 26 | within 456 of `C`: y >= -996 | Yes |
| Long stems | 9 flower rows, 10 foliage tiers | flowers abs(x) <= 186, y in `[-900, -100]`; foliage abs(x) <= 320, y <= 80 | Yes |
| Cascade | Dome `K = 3` (radius 300), fan radius 380, 3 trail lanes | y >= -998, x <= 398, lowest anchor y <= 248, all including jitter | Yes |

With `T <= 5` for every split of 60 items, ring templates never shrink below scale 0.4. At high counts Asymmetric arms, Long stems rows and Cascade lanes overlap; this is the documented fallback and is acceptable because the result stays inside the bounds and fully editable.

**Default item sets** (used only when the bouquet has no flowers or foliage)

| Template | Items |
|----------|-------|
| Round (25) | peony blush 1, rose blush 6, rose white 5, carnation pink 5, eucalyptus 8 |
| Compact (22) | rose white 1, rose peach 6, carnation white 5, carnation pink 4, ruscus 6 |
| Asymmetric (16) | peony blush 1, rose blush 2, lily white 2, tulip pink 5, eucalyptus 4, olive 2 |
| Wild (25) | gerbera orange 3, lavender 3, rose peach 3, tulip yellow 3, carnation pink 3, sunflower 3, fern 3, eucalyptus 2, olive 2 |
| Long stems (11) | lily white 1, tulip white 2, rose red 4, ruscus 4 |
| Cascade (20) | lily white 1, rose white 5, rose blush 4, carnation white 2, tulip white 1, fern 3, ruscus 4 |

**Determinism.** mulberry32 in `domain/composition/rng.ts`; the seed is an argument. Generators round anchors and rotations to integers and scale to two decimals, so output is identical across platforms. An ESLint rule bans `Math.random` in `domain` and `application`.

**Distinctness.** It is guaranteed and tested for 2 or more items. With exactly one flower and no foliage, Round and Compact both place it at `C` and are identical; the spec excludes that case.

**Tests**

| Subject | Assertion |
|---------|-----------|
| Every template, item splits `(n, m)` = (1,0), (0,1), (2,0), (1,1), (7,0), (20,40), (40,20), (60,0), (0,60), (1,59) and the default set | One placement per input item with the same catalog ids and colours; every anchor inside the template's envelope above (hence inside the bounds); deep equality for the same input and seed |
| Every template, default set | One inline golden snapshot |
| Distinctness, shared lists of 2, 12 and 60 items | No two templates produce the same anchor list |
| Jittered templates | Two seeds give different output |
| `applyComposition` | Ids are `e1..eN` and unique; `wrappingId` kept; element count equals item count |
| Round, default set | Anchors mirror about x = 0 |
| Compact, default set | Every anchor within 301 of `C` (300 plus integer rounding) |
| Asymmetric, default set | Over all anchors, flowers and foliage: the farthest anchor with x > `F.x` is at least 1.5 times as far from `F` as the farthest anchor with x < `F.x` (signed sides, not an absolute offset) |
| Long stems, default set | Every flower anchor has abs(x) <= 200 and y <= -600 (actual extremes are 186 and -645, so the test is not at its boundary) |
| Cascade, default set | At least six anchors with x > 0 and y > -420, and the lowest anchor has y > 100 |

### D5. Editor state and architecture

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Pure reducer + Context | No dependency, testable without React; broad re-renders are harmless at this size | **Chosen** |
| Zustand | Ergonomic selectors; a dependency with no present need | Rejected |
| Redux Toolkit | Mature; excessive for one screen | Rejected |

`EditorState = { bouquet, selectedId }`. State and dispatch use separate Contexts. Language and currency are preferences, not editor state, and live in a separate `PreferencesProvider`. In-flight gesture data stays in a ref.

| Action | Effect |
|--------|--------|
| `element/add` | Adds one element with the anchor clamped and the flower's default colour; selects it. No-op at the limit |
| `element/select` | Selects an id or `null` |
| `element/transform` | Sets anchor, rotation or scale, each clamped or normalized |
| `element/recolor` | Sets `colorId`; no-op if the colour is not in the flower's list |
| `element/duplicate` | Copy at index + 1 (directly above), anchor offset `(40, 40)` and clamped, selected. No-op at the limit |
| `element/delete` | Removes the element; no-op for an unknown id |
| `element/reorder` | `forward`, `backward`, `front`, `back`; no-op at the ends |
| `wrapping/set` | Sets or clears `wrappingId`; elements unchanged |
| `composition/apply` | Described in D4 |
| `bouquet/clear` | "New bouquet": removes all elements, resets `wrappingId` to `null`, clears the selection |

The restored draft is the reducer's initial state, so no load action exists. Selectors: `selectSelectedElement`, `selectLayerPosition`, `selectCanAdd`, `selectSummary`.

```
src/
  domain/          pure TS: geometry/ bouquet/ catalog/ composition/ pricing/
  application/     editor/ (state, actions, reducer, selectors)  draft/  preferences/
  infrastructure/  local-storage/ (draft store, preferences store)
  ui/              i18n/ illustrations/ styles/ atoms/ molecules/ organisms/ containers/
  app/             App.tsx (providers, wiring), main.tsx
```

**Dependency rule.** `domain` imports nothing; `application` imports `domain`; `ui` imports `application` and `domain`; `infrastructure` imports `application` and `domain`; `app` imports all. It is enforced with ESLint `no-restricted-imports` per folder (built-in rule, no plugin).

**Container-presentational rule and the one exception.**

| Tier | May read |
|------|----------|
| `ui/containers/` | Editor state, dispatch, preferences, i18n |
| `ui/atoms/`, `molecules/`, `organisms/` | Props, plus the i18n Context through `useT()` only |

Presentational tiers never read editor or preferences state; that data arrives as props, and amounts arrive as strings already formatted by the container with `formatMoney`. Translation is the single permitted Context in presentational tiers because passing about 90 labels as props through every tier would be noise without making components more reusable. The i18n Context defaults to the Spanish dictionary, so a presentational component renders in a test without a provider. ESLint forbids `atoms/`, `molecules/` and `organisms/` from importing `application` context modules and `ui/containers/`.

A UI tier is created when its first component exists. Ports exist only at the storage boundary: `DraftStore` and `PreferencesStore`, both tiny types in `application`.

### D6. Summary and pricing

| Aspect | Decision |
|--------|----------|
| Base currency | COP. Catalog prices are integers in whole pesos, the smallest unit in practical use. Orchestrator assumption, pending user confirmation |
| Rate | `COP_PER_USD = 3400`, one constant in `domain/pricing` |
| USD total | Integer cents, rounded once on the total: `totalCents = Math.floor((totalCop + 17) / 34)`, which is `totalCop * 100 / 3400` rounded half up in integer arithmetic. 34000 COP is exactly USD 10.00 |
| USD lines | Largest-remainder allocation so the displayed lines always sum to the displayed total: each line gets `Math.floor(lineCop / 34)` cents; the cents still missing from `totalCents` go one each to the lines with the largest `lineCop % 34`, ties broken by summary order |
| COP | No rounding: lines and total are exact integers |
| Summary | `summarize(bouquet, catalog)` returns groups (flowers, foliage, wrapping; empty groups omitted) of lines keyed by `(catalogId, colorId)` in catalog order with quantity and line amount, plus the total |
| Single total | Exactly one total row, labelled with the key `summary.estimatedTotal` ("Estimated total" / "Total estimado") |
| Sample-price notice | A visible line in the summary panel under the total, key `summary.samplePricesNotice`, in the active language. The README notice is additional |
| Currency choice | COP or USD; the initial currency is COP; the choice is remembered across reloads (D7) and never changes the bouquet |
| Formatting | `Intl.NumberFormat` at the UI edge with `currencyDisplay: 'code'` to avoid the ambiguous `$`; COP with zero decimals, USD with two; locale follows the language |

Expected output (the separator after the code is a non-breaking space; tests pin the runtime's actual strings):

| Language | Locale | COP | USD |
|----------|--------|-----|-----|
| Spanish | `es-CO` | `COP 84.000` | `USD 24,71` |
| English | `en-US` | `COP 84,000` | `USD 24.71` |

Rejected: floating-point amounts (drift); banker's rounding (unexpected for buyers); rounding each line independently and summing (a 34000 COP bouquet could read USD 9.99); converting lines and total independently (lines could visibly disagree with the total); live exchange rates (needs a backend).

### D7. Localization

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Typed dictionary | About 90 strings; `en.ts` is the source type and `es.ts` must satisfy it, so a missing key is a compile error; zero dependency | **Chosen** |
| i18next + react-i18next | Two dependencies; namespaces, lazy loading and plural rules are unused | Rejected |
| FormatJS, Lingui | ICU parser or a compile step for two static languages | Rejected |

`useT()` returns `t(key, params?)` with `{name}` interpolation; keys are a typed union, so a raw key can never be displayed. Copy is written to avoid plural forms (`Stems: 12`, `x3`). Switching updates `<html lang>`. Initial language is the stored preference, else the browser language when it is Spanish or English, else Spanish. Language and currency are stored together under `vouquet:prefs:v1`; the initial currency is COP.

### D8. Draft persistence

| Aspect | Decision |
|--------|----------|
| Key and payload | `vouquet:draft:v1`, the `Bouquet` as JSON |
| Autosave | Debounced 400 ms after each bouquet change; flushed on `visibilitychange` (hidden) and on `pagehide` |
| Restore | Read once at start, `JSON.parse` then `parseBouquet` |
| Invalid, unknown version, unparsable or above the 60-element limit | Remove the key and start with an empty bouquet, without a notice |
| Storage unavailable or full | The adapter catches the error; the editor keeps working without persistence |

Rejected: partial salvage of valid elements (restores a bouquet the user never made), migrations (only version 1 exists), IndexedDB (one small document).

### D9. UI and UX

| Area | Decision |
|------|----------|
| Desktop (>= 1024 px) | Header 56 px (wordmark, "New bouquet", language and currency segmented switches). Grid: palette 300 px, canvas fluid, summary 320 px |
| Below 1024 px | A column in normal flow: header, canvas region (fills the remaining height), palette sheet. The sheet has tabs and a horizontal item row that scrolls inside itself, so the page never scrolls sideways. The header shows the total as a chip that expands the summary as an inline disclosure over the top of the canvas |
| Palette tabs | Compositions, Flowers, Foliage, Wrapping. Compositions is the default tab while the bouquet has no flowers or foliage, and the empty canvas points to it |
| Wrapping | Chosen in the Wrapping tab by tap or by dropping it on the canvas (the drop position is ignored); a "None" tile clears it |
| Confirmations | Inline and non-modal, in place of the control that was pressed, with Confirm and Cancel. Shown before "New bouquet" when the bouquet has any element or a wrapping, and before a composition is applied to a bouquet that has flowers or foliage. Cancel leaves the bouquet unchanged. An empty bouquet needs no confirmation. No modal dialogs anywhere |
| Identity | Paper `#F6F3EE`, surface `#FFFFFF`, ink `#1E1B18`, muted `#6F6A64`, hairline `#E3DED6`, accent botanical green `#2F4A3C`, danger `#A63D2F`. Serif system stack for the wordmark and headings, system sans for controls. Hand-authored 1.5 px stroke icons. No web fonts, no icon library |
| Styling | CSS Modules plus `tokens.css` custom properties. Tailwind and CSS-in-JS rejected as dependencies; global CSS rejected for collisions |
| Labels | Every label, including each canvas element's accessible name (item, colour, layer) and all toolbar and palette labels, is produced with `useT()` inside the presentational component (D5) |

**Selection toolbar.** Shown while an element is selected, in two fixed rows at every width; controls are 44 px with 4 px gaps.

| Row | Controls | Width |
|-----|----------|-------|
| 1 | Rotate left 15 deg, rotate right 15 deg, smaller 0.1, larger 0.1, send backward, bring forward | 6 controls, about 292 px |
| 2 | Up to 5 colour swatches (recolourable flowers only), duplicate, delete | at most 7 controls, about 340 px |

- The widest row is about 340 px. It fits a 360 px viewport (344 px usable) and the narrowest desktop canvas (404 px), so the toolbar never scrolls horizontally.
- **Docking.** It overlays the canvas region and docks to its bottom edge, or to its top edge when the selected anchor is in the lower half of the model space (`y > -350`), so it does not cover the element. A pure function decides the side. During an active gesture it keeps its side and ignores pointer events.
- **Stacking.** Below 1024 px the palette sheet is in normal flow under the canvas region, so the toolbar sits above the sheet and never overlaps it. Order from top: summary disclosure, toolbar, canvas.
- **Layer controls.** Only forward and backward have buttons. Bring to front and send to back exist in the model and reducer and are reachable with `Shift+]` and `Shift+[`; they have no button, to keep the toolbar inside 360 px.

**Keyboard and accessibility.** Required by the spec: delete, duplicate and layer changes through visible, keyboard-operable buttons (the toolbar). Extras beyond the spec: focusable elements (`role="button"`, focus selects), shortcuts (arrows move the anchor 10, Shift 50; `R` / `Shift+R` rotate; `+` / `-` scale; `[` / `]` backward and forward; `Shift+[` / `Shift+]` back and front; `Delete` removes; `Ctrl/Cmd+D` duplicates; `Escape` deselects), a polite live region, visible focus ring, `prefers-reduced-motion`. The toolbar step buttons give a non-drag path for rotate and scale.

### D10. Testing

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Vitest 5 + Testing Library + jsdom | Shares the Vite config; SVG renders in jsdom | **Chosen** |
| Jest | Separate transform pipeline for the same result | Rejected |
| Vitest browser mode, Playwright | Real layout; browser download in CI, slower loop | Deferred |

| Script | Command |
|--------|---------|
| `dev` | `vite` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `eslint . && prettier --check .` |
| `build` | `tsc --noEmit && vite build` |
| `check` | `npm run typecheck && npm run lint && npm test && npm run build` |
| `deploy:local` | `npm run check`, then Wrangler `deploy` started with `node --env-file=.env.local` (exact invocation confirmed in the deploy smoke task) |

TypeScript flags: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. No coverage threshold and no `jsx-a11y` plugin in the MVP; component tests query by role and accessible name instead.

**TypeScript 7 verification (first scaffold task).** Install `typescript@7.0.2` with `typescript-eslint`, Vitest and Vite, add one component and one test, then run `npm run check`. It passes only if `npm install` reports no peer-dependency error without `--force`, `--legacy-peer-deps` or `overrides`, and all four checks are green. Otherwise pin the highest TypeScript major inside the peer range from `npm view typescript-eslint peerDependencies` and repeat. The outcome is recorded in ADR 0009.

**Enabling Strict TDD.** When `npm run check` is green on the scaffold, set in `openspec/config.yaml`: `strict_tdd: true`, `testing.runner: vitest`, `testing.test_command: npm test`, `layers.unit: true`, `layers.integration: true`, `linter`, `type_checker` and `formatter` true; then re-run `sdd-init`.

### D11. Deployment on Cloudflare

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Workers static assets + Workers Builds | Cloudflare's forward platform; auto deploy from `main`, preview URLs, no token in GitHub | **Chosen** |
| Pages + Git integration | Simpler dashboard; not where Cloudflare invests | Rejected |
| GitHub Actions + `wrangler-action` | Full control; needs an API token as a GitHub secret | Rejected |
| Pages Direct Upload | No Git integration and cannot switch later | Rejected |

| Environment | Source | Mechanism |
|-------------|--------|-----------|
| Development | Local | `npm run dev`; no Cloudflare resource |
| Preview | Any non-`main` branch | Workers Builds non-production build, preview URL on the PR |
| Production | `main` | Workers Builds, `npx wrangler deploy` |

The Cloudflare build command is `npm run check`, so type, lint or test failures block a deploy without any GitHub secret. One Worker, no `env` blocks, no staging Worker.

Files, and nothing more: `wrangler.jsonc` (`name: "vouquet"`, `compatibility_date`, `assets.directory: "./dist"`), `.github/workflows/ci.yml`, `.nvmrc`, `.gitignore`, `.env.local.example`. `not_found_handling` is omitted because the app has no client routes. `wrangler` is a dev dependency so local and hosted deploys use the locked version.

`ci.yml`: on `pull_request` and on push to `main`; `permissions: contents: read`; checkout, setup Node from `.nvmrc` with npm cache, `npm ci`, `npm run check`. No Cloudflare secrets.

**Credentials**

| Path | Credential | Minimal permission | Stored in |
|------|------------|--------------------|-----------|
| Git-integrated builds | Cloudflare GitHub App authorization | "Only select repositories": `canamejoy/VouquetPage` | GitHub and Cloudflare; nothing to copy |
| Git-integrated builds | Build API token | Generated by Cloudflare when the repository is connected | Cloudflare account only |
| CI checks | none | - | - |
| Local manual deploy (optional) | `CLOUDFLARE_API_TOKEN` | Custom token: Account > Workers Scripts > Edit, limited to the one account, no zone permissions, with an expiry | `.env.local` (gitignored) |
| Local manual deploy (optional) | `CLOUDFLARE_ACCOUNT_ID` | Identifier, not a secret | `.env.local` (gitignored) |

`.env.local.example` is committed with both keys empty and a comment per key. The user copies it to `.env.local` and fills it in before running `deploy:local`; the README must say so, because `node --env-file` fails when the file is missing. Vite exposes only `VITE_`-prefixed variables to the bundle, so these two never reach the client. `.gitignore` covers `.env`, `.env.*` (except the example), `.dev.vars*`, `.wrangler/`, `dist/`, `node_modules/`.

**Enforced hygiene check.** `src/test/repo-hygiene.test.ts` runs under `npm test`, and therefore in CI and in the Cloudflare build. It fails when:

- a non-comment line of `.env.local.example` is not exactly `KEY=` with an empty value;
- a key in `.env.local.example` starts with `VITE_`;
- source code reads an `import.meta.env.VITE_*` variable that is not in an explicit public allowlist (empty in the MVP);
- `.gitignore` does not ignore `.env.local`.

The MVP needs no environment variables. When one is needed it is set in the Worker's build settings in the dashboard, not in the repository.

Non-destructive rule: implementation never deletes Workers, never edits DNS, zones, routes or custom domains, and never runs a production deploy on the user's behalf. Connecting the repository and running `deploy:local` are user actions.

### D12. Documentation

README: what VOUQUET is, quick start, scripts table, layer map with the dependency rule, model summary, how to add a catalog item or a composition, deployment steps for the dashboard, preview and production behaviour, the credentials table with every variable and its purpose, the instruction to create `.env.local` from the example before `deploy:local`, the sample-price notice, ADR index.

ADRs in `docs/adr/` (Context, Decision, Alternatives, Consequences): 0001 SVG renderer; 0002 bouquet model; 0003 catalog and illustrations; 0004 compositions; 0005 state and layers; 0006 pricing; 0007 localization; 0008 draft persistence; 0009 testing stack and TypeScript version; 0010 Cloudflare deployment; 0011 styling and visual identity. Each ADR ships in the slice that implements its decision.

## Data Flow

    pointer / keyboard
          |
    ui/containers --(clientToModel + gesture fn, domain/geometry)--> dispatch(action)
          |                                                              |
          |                                               application/editor/reducer
          |                                                 (domain/bouquet operations)
          v                                                              |
    ui/organisms <--- selectors (summarize, layer position) <--- EditorState
                                                                         |
                               DraftAutosave (debounce 400 ms) --> DraftStore --> localStorage

    start: localStorage -> DraftStore.load() -> parseBouquet -> initial state (or empty)

## File Changes

Everything is new except `openspec/config.yaml` (modified to enable Strict TDD).

| Path | Description |
|------|-------------|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `index.html`, `.nvmrc` | Scaffold, scripts, alias `@/` to `src/` |
| `src/test/setup.ts`, `src/test/repo-hygiene.test.ts` | jest-dom matchers and a `setPointerCapture` stub if jsdom lacks it; secrets hygiene check |
| `src/domain/geometry/` | Points, angles, viewport mapping, gesture functions |
| `src/domain/bouquet/` | Types, limits, operations, `applyComposition`, `parseBouquet` |
| `src/domain/catalog/` | Types, colours, catalog data, lookup |
| `src/domain/composition/` | `rng`, layout helpers, six templates, registry |
| `src/domain/pricing/` | `summarize`, `toUsdCents`, `allocateUsdCents` |
| `src/application/{editor,draft,preferences}/` | Reducer, actions, selectors, port types |
| `src/infrastructure/local-storage/` | Draft and preferences stores |
| `src/ui/{i18n,illustrations,styles,atoms,molecules,organisms,containers}/` | Presentation |
| `src/app/` | Composition root |
| `wrangler.jsonc`, `.github/workflows/ci.yml`, `.gitignore`, `.env.local.example` | Delivery and hygiene |
| `README.md`, `docs/adr/0001..0011` | Documentation |

**Slice seams for chained PRs** (each independently green): scaffold and probe; geometry; bouquet model; catalog and pricing; compositions (two slices of three templates); reducer; i18n, preferences and stores; illustrations (three or more slices by group); canvas and gestures; palette and add; toolbar and keyboard; summary, switches and responsive shell; deployment and README.

## Interfaces / Contracts

```ts
// domain/catalog: literal unions derived from the catalog data with `as const`
type FlowerId = 'rose' | 'tulip' | 'peony' | 'carnation' | 'gerbera' | 'lily' | 'sunflower' | 'lavender';
type FoliageId = 'eucalyptus' | 'ruscus' | 'fern' | 'olive' | 'dusty-miller';
type WrappingId = 'kraft' | 'ivory' | 'blush' | 'charcoal' | 'burlap';
type CatalogId = FlowerId | FoliageId | WrappingId;
type ColorId = 'red' | 'blush' | 'white' | 'peach' | 'burgundy' | 'yellow' | 'pink' | 'purple' | 'coral' | 'orange';

interface Size { width: number; height: number }
interface FlowerItem { kind: 'flower'; id: FlowerId; priceCop: number; size: Size; colors: readonly ColorId[] }
interface FoliageItem { kind: 'foliage'; id: FoliageId; priceCop: number; size: Size }
interface WrappingItem { kind: 'wrapping'; id: WrappingId; priceCop: number }
interface Catalog { flowers: readonly FlowerItem[]; foliage: readonly FoliageItem[]; wrappings: readonly WrappingItem[] }

// domain/bouquet
type Point = { x: number; y: number };
interface ElementBase { id: string; position: Point; rotation: number; scale: number } // position is the anchor
interface FlowerElement extends ElementBase { kind: 'flower'; catalogId: FlowerId; colorId: ColorId | null }
interface FoliageElement extends ElementBase { kind: 'foliage'; catalogId: FoliageId }
type BouquetElement = FlowerElement | FoliageElement;
interface Bouquet { schemaVersion: 1; elements: BouquetElement[]; wrappingId: WrappingId | null }

// domain/geometry
interface Viewport { left: number; top: number; width: number; height: number }
interface GestureStart { pointer: Point; position: Point; rotation: number; scale: number }
clientToModel(client: Point, viewport: Viewport): Point   // inverse of viewBox, xMidYMid meet
modelPerPixel(viewport: Viewport): number
moveGesture(start: GestureStart, pointer: Point): Point    // anchor, clamped to bounds
rotateGesture(start: GestureStart, pointer: Point): number // start + angle delta about the anchor
scaleGesture(start: GestureStart, pointer: Point): number  // start * distance ratio, clamped

// domain/pricing
toUsdCents(totalCop: number): number                       // floor((cop + 17) / 34)
allocateUsdCents(linesCop: readonly number[]): number[]    // sums to toUsdCents(sum of lines)

// application/draft
interface DraftStore { load(): unknown; save(bouquet: Bouquet): void; clear(): void }
```

## Testing Strategy

| Layer | What to test | Approach |
|-------|--------------|----------|
| Unit: `domain` | Geometry, element operations, the 60-element limit, anchor clamping, `parseBouquet` rejections, summary, USD rounding boundaries (16, 17, 34000 COP) and lines summing to the total, PRNG, six generators (D4 table) | Vitest, no DOM, table-driven |
| Unit: `application` | Every action, no-op cases, `bouquet/clear` resetting the wrapping, selectors | Reducer called directly |
| Integration: `infrastructure` | Save, load, corrupt JSON, throwing storage | Fake `Storage` |
| Integration: `ui` | Tap add, drag add, drop outside, `pointercancel`, deselect on background, toolbar, toolbar dock side, confirmations and cancel, keyboard, colour availability, "Estimated total" label, sample-price notice, currency and its persistence, language switch, draft restore | Testing Library + user-event in jsdom, queries by role |
| Repository | `.env.local.example` and `VITE_` hygiene | `repo-hygiene.test.ts` |
| E2E | None in the MVP | Manual deploy smoke on a real touch device |

## Threat Matrix

The change adds a CI workflow and npm scripts but no Git, PR or path-classification automation.

| Boundary | Applicability |
|----------|---------------|
| Documentation-like paths | N/A: nothing classifies or executes files by path |
| Git repository selection | N/A: no Git command is composed |
| Commit state | N/A: nothing commits |
| Push state | N/A: nothing pushes |
| PR commands | N/A: `ci.yml` only runs `npm ci` and `npm run check` with read-only permissions |

## Migration / Rollout

No migration required. Rollout order: scaffold and CI, feature slices, then the user connects the repository in the Cloudflare dashboard and a deploy smoke check confirms the preview and production URLs. Rollback: redeploy the previous Worker version or disconnect the build.

## Open Questions

Resolved:

- [x] TypeScript pin: 7.0.2 if the scaffold probe passes, else the highest major in the typescript-eslint peer range (D10).
- [x] Styling: CSS Modules plus token custom properties (D9).
- [x] Canvas size and origin: 1000 x 1300 model units, origin at the binding point (D2).
- [x] Wrapping order: back panel, stems, front panel, then elements (D1).
- [x] PRNG and parameters: mulberry32 with a per-template seed; the items come from the bouquet, or from the default set when it has no flowers or foliage (D4).
- [x] USD rounding: half up on the total, largest-remainder allocation on the lines (D6).
- [x] Spec alignment: the 60-element limit, the remembered currency, the inline confirmations, the wrapping as a field and anchor-based bounds now match the amended specs.

Still open, with the default this design applies:

- [ ] Prices authored in COP as sample data is an orchestrator assumption awaiting user confirmation.
- [ ] "Non-empty" for the "New bouquet" confirmation is read as "any element or a wrapping", because clearing also resets the wrapping. The amended spec does not say whether a wrapping-only bouquet needs the confirmation.
- [ ] Bring to front and send to back have keyboard shortcuts but no button, so touch-only users reach them by repeating forward or backward.
- [ ] To verify at scaffold or deploy smoke: the exact `Intl` output strings; jsdom support for `PointerEvent` and pointer capture; `.nvmrc` value `24` accepted by the Workers Builds image (local Node is 26); the default non-production deploy command; the `deploy:local` Wrangler invocation; the `Workers Scripts: Edit` token being sufficient for `wrangler deploy`; perpendicular-drag behaviour of `touch-action` on real touch devices.
