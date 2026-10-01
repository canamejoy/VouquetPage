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

Branch `feat/bouquet-editor-03-catalog` (base `feat/bouquet-editor-02-geometry`). Status: 3/3 tasks of Group 3 complete (Groups 4 to 27 pending).

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
