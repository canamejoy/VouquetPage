# Apply Progress: bouquet-editor-mvp

Mode: Strict TDD (runner Vitest 5, `npm test`). Delivery: auto-chain, stacked-to-main.

## Batch 1: Group 1, slice 1 "Scaffold, test runner, probes" (tasks 1.1 to 1.9)

Branch `feat/bouquet-editor-01-scaffold` (base `main` at 58e6c33). Status: 9/9 tasks of Group 1 complete.

| Task | State | Evidence |
|------|-------|----------|
| 1.1 | done | package.json, tsconfig.json (strict flags, alias `@/`), vite.config.ts, index.html, .nvmrc (24), .prettierrc |
| 1.2 | done | typescript@7.0.2 rejected (ERESOLVE, typescript-eslint@8.71.0 peer `>=4.8.4 <6.1.0`); typescript@6.0.3 accepted, plain `npm install` and `npm ci` clean |
| 1.3 | done | RED: Probe.test.tsx failed with "Failed to resolve import ./Probe" |
| 1.4 | done | GREEN: Probe.tsx, main.tsx, setup.ts; 2 tests pass |
| 1.5 | done | RED: setPointerCapture `typeof` was `undefined` (1 failed, 2 passed); GREEN after stub in setup.ts; PointerEvent already supported |
| 1.6 | done | eslint.config.js; negative probes (temporary files, removed) produced 8 expected errors, allowed import in containers passed |
| 1.7 | done | .github/workflows/ci.yml |
| 1.8 | done | `npm run check` green; openspec/config.yaml flipped (strict_tdd true, vitest, `npm test`, flags). Orchestrator must re-run sdd-init |
| 1.9 | done | docs/adr/0009-testing-stack-and-typescript.md, README.md |

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.3/1.4 | `src/ui/atoms/Probe.test.tsx` | Integration (component) | N/A (new) | Written, failed on missing import | 2/2 passed | 2 cases (different titles) | None needed |
| 1.5 | `src/test/pointer-probe.test.ts` | Unit (environment probe) | N/A (new) | 1 of 3 failed (pointer capture) | 3/3 passed after stub | 3 cases | None needed |
| 1.1, 1.2, 1.6, 1.7, 1.8, 1.9 | N/A | Config and docs | N/A | N/A: no testable logic; verified by `npm run check` and negative lint probes | N/A | Skipped: structural | N/A |

Total tests: 5 passing. Note: an empty `src/test/setup.ts` existed during RED so vitest could start; setup content was added in GREEN.

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `npm test`: 2 files, 5 tests passed |
| Runtime harness | `npm run check`: typecheck, lint, test, build all exit 0 |
| Rollback boundary | revert PR 1 (all files in this branch plus openspec/config.yaml) |

### Deviations and findings

- TypeScript pinned to 6.0.3 instead of 7.0.2 (probe result, per design D10 fallback).
- `baseUrl` omitted from tsconfig (deprecated in TS 6); `paths` uses `./src/*`.
- Changed lines (excluding package-lock.json): 458 additions before the openspec edits, above the 400 budget. Not trimmed. Proposed re-slice: 1a tooling, Probe, pointer probe, CI (about 217 lines); 1b ESLint layer rules, ADR 0009, README, config flip (about 260 lines).
- ESLint presentational rule bars application modules matching `*Provider*`, `*Context*`, `use*`; later slices may need to adjust names.

## Batch 2: Group 2, slice 2 "Geometry" (tasks 2.1 to 2.4) plus ESLint follow-up

Branch `feat/bouquet-editor-02-geometry` (base `feat/bouquet-editor-01-scaffold`). Status: 4/4 tasks of Group 2 complete (Groups 3 to 27 pending).

| Task | State | Evidence |
|------|-------|----------|
| 2.1 | done | RED: `geometry.test.ts` failed with "Failed to resolve import ./viewport" (no tests ran) |
| 2.2 | done | GREEN: `point.ts`, `viewport.ts`, `angle.ts`; 20/20 tests pass |
| 2.3 | done | RED: `gestures.test.ts` failed with "Failed to resolve import ./gestures" (no tests ran) |
| 2.4 | done | GREEN: `gestures.ts` and `index.ts`; 32/32 tests pass in `src/domain/geometry` |
| follow-up | done | ESLint: `react/**` and `react-dom/**` subpaths, `ImportExpression` ban in domain, anchored layer regexes; verified with 34 stdin probes |

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1/2.2 | `src/domain/geometry/geometry.test.ts` | Unit | N/A (new) | Failed on missing `./viewport` import | 20/20 passed | 3 viewports (exact, wide, tall), 8 angle values, 3 clamp cases | Exported `clamp` as a const (no behavior change), 20/20 still pass |
| 2.3/2.4 | `src/domain/geometry/gestures.test.ts` | Unit | 20/20 (geometry.test.ts) | Failed on missing `./gestures` import | 12/12 passed (32/32 in folder) | move 3, rotate 5, scale 4 cases | None needed |
| follow-up | stdin ESLint probes (no repo file) | Config | `npm run lint` green | Old config, observed: `react/jsx-runtime`, `react-dom/client` and dynamic `import()` (2 probes) allowed in domain; `./ui/foo`, `./app/foo`, `./containers/foo` blocked although they stay inside the importing layer | all expected results after change | 34 probes both directions | None needed |

Total tests: 37 passing (5 from slice 1, 32 new).

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `npx vitest run src/domain/geometry`: 2 files, 32 tests passed |
| Runtime harness | N/A: pure functions. ESLint changes verified with `npx eslint --stdin --stdin-filename <virtual path>` probes; `npm run check` green |
| Rollback boundary | `src/domain/geometry` (feature commit); `eslint.config.js` (lint commit); both independent |

### Deviations and findings

- Design D1 lists `GestureStart`, `Viewport`, `moveGesture`, `rotateGesture`, `scaleGesture` in `domain/geometry`; `Point` also lives there (`point.ts`), and `bouquet` types in D2 re-declare `Point`. Slice 4 should import `Point` from geometry instead of declaring it again.
- Added `MODEL_BOUNDS`, `clampToBounds`, `clamp`, `SCALE_MIN`, `SCALE_MAX` (not named in the Interfaces block) because the gesture functions need them and slice 4 operations will reuse them.
- `scaleGesture` returns the starting scale when the grab point is exactly on the anchor (distance ratio undefined). Not specified in the design.
- `rotateGesture` returns unrounded degrees (normalized to `[0, 360)`); design says only that stored rotation is normalized.
- `import()` is banned only in `domain`, as requested. `application`, `infrastructure` and `ui` can still bypass their rules with a dynamic import (lazy loading in `ui` may be legitimate).
- Layer patterns now use `regex` anchors; a relative import is matched by its leading `../` chain only, so `../application` from `src/domain/x` is treated as reaching the application layer (conservative).

## Batch 3: Group 3, slice 3 "Catalog" (tasks 3.1 to 3.3)

Split a/b because the slice measured 419 changed lines (budget 400). 3a: branch `feat/bouquet-editor-03a-catalog-data` (base `feat/bouquet-editor-02-geometry`), PR #5, 378 lines, code and tests. 3b: branch `feat/bouquet-editor-03-catalog` (base 3a), PR #6, SDD progress record. Status: 3/3 tasks of Group 3 complete (Groups 4 to 27 pending).

| Task | State | Evidence |
|------|-------|----------|
| 3.1 | done | RED: `catalog.test.ts` failed with "Failed to resolve import ./data" (no tests ran) |
| 3.2 | done | GREEN: `types.ts`, `colors.ts`, `data.ts`, `lookup.ts`, `index.ts`; 15/15 tests pass |
| 3.3 | done | RED: 5 of 20 failed with "isColorAvailable is not a function"; GREEN: `isColorAvailable`, `defaultColor` added, 20/20 pass |

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1/3.2 | `src/domain/catalog/catalog.test.ts` | Unit | N/A (new) | Failed on missing `./data` import | 15/15 passed | counts, unique ids, all prices and sizes pinned, hex pinned, 3 lookup kinds plus unknown ids | None needed |
| 3.3 | `src/domain/catalog/catalog.test.ts` | Unit | 15/15 | 5 failed (`isColorAvailable is not a function`) | 20/20 passed | accept, reject outside list, fixed flowers, unknown flower, default colour | None needed |

Total tests: 57 passing (37 before, 20 new).

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command | `npx vitest run src/domain/catalog`: 1 file, 20 tests passed |
| Runtime harness | N/A: static data and pure functions; `npm run check` green |
| Rollback boundary | `src/domain/catalog` |

### Deviations and findings

- Design D3 does not name lookup helpers; added `getItem`, `getFlower`, `getFoliage`, `getWrapping`, `isColorAvailable`, `defaultColor` (each takes an optional catalog, defaulting to `CATALOG`, matching `parseBouquet(raw, catalog)` and `CompositionGenerator` which receive a catalog).
- `ColorId` is derived from `COLOR_HEX` keys (`as const`) in `colors.ts`; the id unions for flowers, foliage and wrappings are written out in `types.ts` as in the Interfaces block (a test pins data against them via the typed `Catalog`, and uniqueness is tested). Not derived from data to avoid a circular type dependency.
- Wrapping id `blush` and colour id `blush` share a string but live in separate dictionary namespaces (`catalog.blush` versus `color.blush`); no clash in code since `ColorId` and `WrappingId` are distinct types. Slice 11 must not flatten them.
- Catalog items carry no name or illustration field (names come from `catalog.<id>` keys, illustrations from the slice 15 registry), per D3.
- Prices are sample data authored in whole COP (comment in `data.ts`); COP base currency still awaits user confirmation (U5).

## Batch 4: Group 4, slice 4 "Bouquet operations" (tasks 4.1 to 4.6)

Split a/b (whole slice about 640 lines). 4a: `feat/bouquet-editor-04a-core-operations` (base `feat/bouquet-editor-03-catalog`), 338 lines, types, limits, ids, add, transform, recolor, delete. 4b: `feat/bouquet-editor-04-bouquet-ops` (base 4a), duplicate, reorder, wrapping, clear, quantities, ADR 0002, this record. PR numbers in the PR bodies. 6/6 tasks of Group 4 complete (Groups 5 to 27 pending). Tests: 100 passing (57 before, 43 new).

- RED per pair observed: 4a import of `./add` unresolved (no tests ran); 4b 14 of 38 failed (`duplicateElement`/`reorderElement` not a function) plus `./quantities` unresolved. GREEN: 24/24 then 43/43 in `src/domain/bouquet`.
- Deviations: `clamp` now exported from `domain/geometry/index.ts`; `Point` imported from geometry, not redeclared; `addElement(bouquet, catalogId, position, catalog?)` takes only flower or foliage ids; no-ops return the same reference; added `elementQuantities`, `ReorderDirection`, `DUPLICATE_OFFSET`.
- Rollback: `src/domain/bouquet` and `docs/adr/0002-bouquet-model.md`.

## Batch 5: Group 5, slice 5 "Bouquet validation" (tasks 5.1, 5.2)

Branch `feat/bouquet-editor-05-parse` (base `feat/bouquet-editor-04-bouquet-ops`), single PR, about 240 changed lines. 2/2 tasks of Group 5 complete (Groups 6 to 27 pending). Tests: 160 passing in `npm test` (60 new in `parse.test.ts`).

- RED: `parse.test.ts` failed on unresolved `./parse` import (no tests ran). GREEN: 103/103 in `src/domain/bouquet`.
- Choices where the design is silent: a recolourable flower with `colorId` null or missing is rejected, and a fixed-colour flower with a non-null `colorId` is rejected; foliage ignores any `colorId`; unknown extra properties are dropped (fresh objects returned); `ID_PATTERN` is now exported from `ids.ts` and reused; ids need not be contiguous.
- Rollback: `src/domain/bouquet/parse.ts`, `parse.test.ts`, the `parseBouquet` export, `ID_PATTERN` export.

## Batch 6: Group 6, slice 6 "Pricing" (tasks 6.1 to 6.5)

Split a/b (whole slice 456 lines). 6a: `feat/bouquet-editor-06a-usd-allocation` (base `feat/bouquet-editor-05-parse`), 120 lines, USD conversion and allocation. 6b: `feat/bouquet-editor-06-pricing` (base 6a), 341 lines, summarize, ADR 0006, this record. PR numbers in the PR bodies. 5/5 tasks of Group 6 complete (Groups 7 to 27 pending). Tests: 190 passing (160 before, 30 new).

- RED: `usd.test.ts` and `summarize.test.ts` each failed on an unresolved import (no tests ran). GREEN: 18/18 then 30/30 in `src/domain/pricing`.
- Choices where the design is silent: lines in catalog order, colours in the flower colour list order (that order is also the allocation tie-break); wrapping line has quantity 1 and null colour; unknown catalog ids are skipped; summary carries integers only (`lineCop`, `lineUsdCents`, `totalCop`, `totalUsdCents`, `unitCop`).
- Design formula and spec examples verified: 16 gives 0, 17 gives 1, 34000 gives 1000, 3 x 1000 COP gives 88 cents (30, 29, 29), exhaustive half-up check to 20000, 2000 random line sets sum exactly.
- Rollback: `src/domain/pricing`, `docs/adr/0006-pricing.md`.

## Batch 7: Group 7, slice 7 "Composition core" (tasks 7.1 to 7.6)

Split a/b/c/d (whole slice 1105 lines). 7a: `feat/bouquet-editor-07a-rng-rings` (base `feat/bouquet-editor-06-pricing`), 368 lines, PRNG, rounding guards, ring slots. 7b: `feat/bouquet-editor-07b-lanes-types` (base 7a), 293 lines, lanes, generator types, ADR 0004. 7c: `feat/bouquet-editor-07c-canonical-order` (base 7b), 177 lines, canonical order. 7d: `feat/bouquet-editor-07-composition-core` (base 7c), 267 lines, `applyComposition`, index, this record. PR numbers in the PR bodies. 6/6 tasks of Group 7 complete (Groups 8 to 27 pending). Tests: 276 passing (190 before, 86 new).

- RED per pair observed: each test file failed on its unresolved import (`./rng`, `./rounding`, `./rings`, `./lanes`, `./order`, `./compose`; no tests ran). GREEN: 6, 45, 73, 75 (composition, with a 1891-split envelope test) and 11 in compose.test.ts.
- Design silent or adjusted: `applyComposition(bouquet, template, catalog = CATALOG)` takes a `CompositionTemplate` (`id`, `seed`, `defaultItems`, `generate`); canonical ordering lives in `order.ts` (not `types.ts`); added `rounding.ts` (`roundAnchor`, `roundRotation`, `roundScale`); `applyComposition` also drops extra placements and clamps anchors. All design formulas held for every split of 60 items (T <= 5, no division by zero, anchors inside the bounds for Round and Compact).
- Rollback: `src/domain/composition`, `src/domain/bouquet/compose*`, `docs/adr/0004-compositions.md`.

## Batch 8: Group 8, slice 8 "Templates A" (tasks 8.1 to 8.4)

Split a/b. 8a: `feat/bouquet-editor-08a-ring-templates` (base `feat/bouquet-editor-07-composition-core`), 307 lines, Round, Compact, shared ring layout. 8b: `feat/bouquet-editor-08-templates-a` (base 8a), Asymmetric and this record. PR numbers in the PR bodies. 4/4 tasks of Group 8 complete (Groups 9 to 27 pending). Tests: 322 passing (276 before, 46 new).

- RED: `templates-a.test.ts` failed on unresolved template imports (no tests ran), once per unit. GREEN: 30/30 then 46/46.
- Design held: every anchor of the three templates stays inside its envelope for all 1891 splits of 1 to 60 items; Asymmetric extremes x -447 and 392, y -973 (as designed); default-set ratio right to left 2.5 (needs 1.5). Compact scale floor 0.4 is never reached (0.42 at T = 5).
- Choices where the design is silent: jitter applies to focal flowers too (three seeded draws per element: x, y, rotation); focal rotation is the slot direction (270 and 90 for a pair); foliage scale on each arm follows the arm's flower rule; each template file exports its default set.
- Rollback: `src/domain/composition/templates`, `templates-a.test.ts`.

## Batch 9: Group 9, slice 9 "Templates B" (tasks 9.1 to 9.5)

Split a/b. 9a: `feat/bouquet-editor-09a-wild-long-stems` (base `feat/bouquet-editor-08-templates-a`), 296 lines, Wild and Long stems. 9b: `feat/bouquet-editor-09-templates-b` (base 9a), Cascade, registry, distinctness, this record. PR numbers in the PR bodies. 5/5 tasks of Group 9 complete (Groups 10 to 27 pending). Tests: 370 passing (322 before, 48 new).

- RED: `templates-b.test.ts` failed on unresolved template and registry imports (no tests ran), once per unit. GREEN: 28/28 then 48/48.
- Design held: all anchors stay inside the D4 envelopes for all 1891 splits of 1 to 60 items; Long stems default extremes x 186, y -645; Cascade default lowest anchor y 241.
- Choices where the design is silent: the registry entry is exactly `CompositionTemplate` (`id`, `seed`, `defaultItems`, `generate`), with ids `round`, `compact`, `asymmetric`, `wild`, `long-stems`, `cascade`, seeds 1 to 6; the design has no name or description fields, so the UI derives dictionary keys from `id` in slice 11. Wild shuffles flowers and foliage separately; Cascade dome scale uses factor 1 and its flowers split by canonical order (largest first in the dome).
- Rollback: `src/domain/composition/{registry.ts,templates/wild.ts,longStems.ts,cascade.ts}`, `templates-b.test.ts`, the `COMPOSITIONS` export.

## Batch 10: Group 10, slice 10 "Editor reducer" (tasks 10.1 to 10.5)

Split a/b. 10a: `feat/bouquet-editor-10a-reducer` (base `feat/bouquet-editor-09-templates-b`), 353 lines, state, actions, reducer. 10b: `feat/bouquet-editor-10-reducer` (base 10a), selectors, ADR 0005, this record. PR numbers in the PR bodies. 5/5 tasks of Group 10 complete (Groups 11 to 27 pending). Tests: 406 passing (370 before, 36 new).

- RED: `reducer.test.ts` and `selectors.test.ts` each failed on an unresolved import (no tests ran), once per unit. GREEN: 32/32 then 36/36 in `src/application/editor`.
- Choices where the design is silent: `composition/apply` carries `compositionId` (unknown id is a no-op); `element/select` with an unknown id is a no-op; `bouquet/clear` on an empty, unselected state is a no-op; `initialEditorState(bouquet?)` is the initial state; `selectLayerPosition` returns `{ position (1-based from the back), count }` or null. No React in this slice (Context arrives with the UI).
- Rollback: `src/application/editor`, `docs/adr/0005-state-and-layers.md`.

## Batch 11: Group 11, slice 11 "Localization" (tasks 11.1 to 11.6)

Split a/b. 11a: `feat/bouquet-editor-11a-dictionaries` (base `feat/bouquet-editor-10-reducer`), 315 lines, dictionaries, `createTranslate`, `I18nProvider`, `useT`. 11b: `feat/bouquet-editor-11-i18n` (base 11a), `resolveInitialLanguage`, `formatMoney`, ADR 0007, this record. PR numbers in the PR bodies. 6/6 tasks of Group 11 complete (Groups 12 to 27 pending). Tests: 429 passing (406 before, 23 new).

- RED: each test file failed on an unresolved import (no tests ran), once per file. GREEN: 7/7, then 16/16 more in `src/ui/i18n`. Removing a key from `es.ts` makes `npm run typecheck` fail (2 errors), confirming the compile-time check.
- Choices where the design is silent: 82 flat dotted keys; `canvas.elementLabelFixedColor` for non-recolourable items; `resolveInitialLanguage(stored, browserLanguages)` is pure; `formatMoney(amount, currency, language)` takes COP whole pesos or USD cents.
- `Intl` output matches the design exactly (non-breaking space after the code); pinned in `formatMoney.test.ts`.
- Rollback: `src/ui/i18n`, `docs/adr/0007-localization.md`.

## Batch 12: Group 12, slice 12 "Persistence" (tasks 12.1 to 12.5)

Split a/b. 12a: `feat/bouquet-editor-12a-draft-autosave` (base `feat/bouquet-editor-11-i18n`), 289 lines, `DraftStore` port, draft store, autosave. 12b: `feat/bouquet-editor-12-persistence` (base 12a), preferences port and store, ADR 0008, this record. PR numbers in the PR bodies. 5/5 tasks of Group 12 complete (Groups 13 to 27 pending). Tests: 452 passing (429 before, 23 new).

- RED: `draftStore.test.ts`, `autosave.test.ts` and `preferencesStore.test.ts` each failed on an unresolved import (no tests ran). GREEN: 10/10, 5/5 and 8/8.
- Design adjusted: `DraftStore.load()` returns `Bouquet | null` (the store runs `parseBouquet` and removes invalid data), not `unknown`. `Language` and `Currency` moved to `application/preferences/ports.ts` (ui re-exports them). Keys `vouquet:draft:v1` and `vouquet:prefs:v1` (`{ language, currency }`).
- `createDraftAutosave(store)` returns `{ schedule, flush, dispose }`; no React in this slice.
- Rollback 12b: `src/application/preferences`, `preferencesStore*`, ADR 0008, the two re-export edits in `src/ui/i18n`.

## Batch 13: Group 13, slice 13 "Flower art" (tasks 13.1 to 13.5)

Split a/b. 13a: `feat/bouquet-editor-13a-flower-paths` (base `feat/bouquet-editor-12-persistence`), path builders and tests. 13b: `feat/bouquet-editor-13-flower-art` (base 13a), 8 flowers, registry, ADR 0003, this record. PR numbers in the PR bodies. 5/5 tasks of Group 13 complete (Groups 14 to 27 pending). Tests: 482 passing (452 before, 30 new).

- RED: `flowers.test.tsx` failed on an unresolved registry import (no tests ran); `paths.test.ts` was written after `paths.ts` (builders were extracted from the first drawing), so it has no observed RED. GREEN: 25/25 and 5/5.
- Drawn art was rasterized with a throwaway resvg script (not committed) and looked at; recolour technique is `currentColor` plus black/white translucent overlays (`flowers/paint.ts`). Registry: `flowerIllustrations: Record<FlowerId, ComponentType>`.
- Rollback 13b: `src/ui/illustrations/flowers*`, ADR 0003.

Refinement 13c (`feat/bouquet-editor-13c-flower-refine`, base 13): rose, peony, carnation and lily redrawn after art review (distinct overlapping petals, soft per-petal shading instead of dark rims). New builders `ruffle` and `fringedRing` (RED observed: `not a function`); carnation shape bound raised to 14. Tests: 484 passing.

## Batch 14: Group 14, slice 14 "Foliage art" (tasks 14.1, 14.2) plus carnation carry-over

Single PR: `feat/bouquet-editor-14-foliage-art` (base `feat/bouquet-editor-13c-flower-refine`). 5 foliage illustrations, `foliageIllustrations: Record<FoliageId, ComponentType>`, `foliage/paths.ts` (`leaf`, `rib`, `pinnate`), shared test helpers in `svg.testutil.tsx`, and a white-carnation fix (soft tier shading instead of thin rims). 2/2 tasks of Group 14 complete (Groups 15 to 27 pending). Tests: 506 passing (484 before, 22 new).

- RED: `foliage.test.tsx` and `foliage/paths.test.ts` failed on unresolved imports (no tests ran). GREEN: 6/6 paths tests, 22/22 foliage tests after tuning leaf sizes until the size-bound test passed.
- Art was iterated by rasterizing in a scratch folder outside the repository; nothing from it is committed.
- Rollback: `src/ui/illustrations/foliage*`, `svg.testutil.tsx` (and the import edit in `flowers.test.tsx`); the carnation fix is its own commit.
