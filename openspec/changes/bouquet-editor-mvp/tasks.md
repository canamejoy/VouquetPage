# Tasks: Bouquet Editor MVP

Note: the 530-word guidance of the tasks skill cannot hold for a 28-unit greenfield MVP with 30 requirements; each task is kept to one or two lines.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | about 8,500 authored (range 7,500 to 9,500), excluding `package-lock.json` and the baseline commit |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Baseline commit (no PR), then PR 1 to PR 27 in the order below (slice seams from design) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Chain strategy chosen by the user on 2026-10-01: stacked-to-main. PR 1 targets `main`; PR N targets the branch of PR N-1 until that PR merges, then it is retargeted to `main`; PRs merge in order. Merging is a user decision. The user also authorized the baseline commit on `main`, pushes to `origin` and PR creation. Feature-branch-chain: tracker branch `feat/bouquet-editor-mvp` (draft, no-merge), PR 1 base = tracker, PR N base = PR N-1 branch. Branch names: `feat/bouquet-editor-NN-<slug>`. Review budget is fixed at 400 changed lines (additions plus deletions); if a slice measures above it during apply, re-slice by work unit and never trim tests, comments or docs. Tightest slices (risk of overage): 4, 8, 9, 10, 17, 18, 19, 21.

### Slice list (dependency order)

| # | Name | Scope | Est. lines | Depends on |
|---|------|-------|-----------|------------|
| 0 | Baseline | Initial commit on `main`: `.gitignore`, `openspec/` (no PR) | n/a | none |
| 1 | Scaffold and probes | Vite, TS, ESLint layer rules, Vitest, CI, `.nvmrc`, ADR 0009, Strict TDD flip | 340 | 0 |
| 2 | Geometry | Points, viewport mapping, gesture functions | 300 | 1 |
| 3 | Catalog | Types, colours, 18 items, lookup | 260 | 1 |
| 4 | Bouquet operations | Model types, limits, element operations, ADR 0002 | 380 | 2, 3 |
| 5 | Bouquet validation | `parseBouquet` | 250 | 4 |
| 6 | Pricing | `summarize`, USD cents, allocation, ADR 0006 | 300 | 3, 4 |
| 7 | Composition core | PRNG, ring and lane helpers, `applyComposition`, ADR 0004 | 300 | 4 |
| 8 | Templates A | Round, Compact, Asymmetric | 380 | 7 |
| 9 | Templates B | Wild, Long stems, Cascade, registry, distinctness | 380 | 8 |
| 10 | Editor reducer | Actions, reducer, selectors, ADR 0005 | 370 | 4, 9 |
| 11 | Localization | Dictionaries, `useT`, `formatMoney`, ADR 0007 | 330 | 1 |
| 12 | Persistence | Ports, local-storage stores, autosave, ADR 0008 | 350 | 5, 11 |
| 13 | Flower art | 8 flower illustrations, ADR 0003 | 320 | 3 |
| 14 | Foliage art | 5 foliage illustrations | 230 | 13 |
| 15 | Wrapping art | 5 wrappings (back and front), full registry | 260 | 14 |
| 16 | Tokens and atoms | `tokens.css`, atoms, icons, ADR 0011 | 300 | 11 |
| 17 | Canvas render | `EditorCanvas`, stems, overlay frame, labels, ADR 0001 | 380 | 2, 15, 16 |
| 18 | Gestures | Transform gestures, deselect, `touch-action` | 380 | 10, 17 |
| 19 | Palette and add | Tabs, tap add, wrapping, composition confirm | 390 | 10, 16 |
| 20 | Drag add | Ghost, drop rules, cancel | 300 | 18, 19 |
| 21 | Selection toolbar | Two rows, dock side, recolour | 380 | 18 |
| 22 | Keyboard | Shortcuts, focus, live region | 300 | 21 |
| 23 | Summary and switches | Summary panel, currency and language switches | 330 | 6, 12, 16 |
| 24 | Header and app wiring | Header, New bouquet confirm, providers, draft wiring | 350 | 20, 22, 23 |
| 25 | Responsive shell | Desktop grid, below-1024 layout, disclosure, hint | 300 | 24 |
| 26 | Deployment and README | Wrangler, hygiene test, README, ADR 0010 | 320 | 25 |
| 27 | Final verification | Deferred checks, results recorded | 60 | 26 |

Parallel candidates (only if a stacked chain has idle reviewers): 2 and 3; 11 and the 4 to 10 line; 13 to 15 are independent of 4 to 12. Default execution is sequential.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 0 | Baseline `main` | none | `git log --oneline` shows one commit | N/A: no code | not applicable (first commit) |
| 1 | Scaffold, test runner, CI | PR 1 (base: `main` or tracker) | `npm test` | `npm run check` | revert PR 1 |
| 2 | Geometry | PR 2 | `npx vitest run src/domain/geometry` | N/A: pure functions | `src/domain/geometry` |
| 3 | Catalog | PR 3 | `npx vitest run src/domain/catalog` | N/A: static data | `src/domain/catalog` |
| 4 | Bouquet ops | PR 4 | `npx vitest run src/domain/bouquet` | N/A: pure | `src/domain/bouquet` operations |
| 5 | parseBouquet | PR 5 | `npx vitest run src/domain/bouquet/parse` | N/A: pure | parse files only |
| 6 | Pricing | PR 6 | `npx vitest run src/domain/pricing` | N/A: pure | `src/domain/pricing` |
| 7 | Composition core | PR 7 | `npx vitest run src/domain/composition` | N/A: pure | helper files |
| 8 | Templates A | PR 8 | `npx vitest run src/domain/composition` | N/A: pure | three template files |
| 9 | Templates B | PR 9 | `npx vitest run src/domain/composition` | N/A: pure | three template files and registry |
| 10 | Reducer | PR 10 | `npx vitest run src/application/editor` | N/A: pure | `src/application/editor` |
| 11 | i18n | PR 11 | `npx vitest run src/ui/i18n` | `npm run check` | `src/ui/i18n` |
| 12 | Persistence | PR 12 | `npx vitest run src/infrastructure src/application` | N/A: fake `Storage` in tests | stores and draft or prefs ports |
| 13 | Flower art | PR 13 | `npx vitest run src/ui/illustrations` | `npm run dev`, render each flower | flower files |
| 14 | Foliage art | PR 14 | `npx vitest run src/ui/illustrations` | `npm run dev` | foliage files |
| 15 | Wrapping art | PR 15 | `npx vitest run src/ui/illustrations` | `npm run dev` | wrapping files and registry |
| 16 | Tokens, atoms | PR 16 | `npx vitest run src/ui/atoms` | `npm run dev` | tokens and atoms |
| 17 | Canvas render | PR 17 | `npx vitest run src/ui/organisms/EditorCanvas` | `npm run dev` with a seeded bouquet | canvas organism |
| 18 | Gestures | PR 18 | `npx vitest run src/ui/containers` | `npm run dev`, drag with mouse | gesture hook and container |
| 19 | Palette | PR 19 | `npx vitest run src/ui/organisms/Palette` | `npm run dev`, tap items | palette files |
| 20 | Drag add | PR 20 | `npx vitest run src/ui/containers/palette` | `npm run dev`, drag to canvas | drag hook |
| 21 | Toolbar | PR 21 | `npx vitest run src/ui/organisms/SelectionToolbar` | `npm run dev` | toolbar files |
| 22 | Keyboard | PR 22 | `npx vitest run src/ui/containers/keyboard` | `npm run dev`, keys | keyboard hook |
| 23 | Summary | PR 23 | `npx vitest run src/ui/organisms/SummaryPanel` | `npm run dev`, switch currency | summary files |
| 24 | App wiring | PR 24 | `npm test` | `npm run dev`, full flow and reload | `src/app`, header |
| 25 | Responsive | PR 25 | `npm test` | `npm run dev` at 360 px and 1280 px | layout CSS |
| 26 | Deployment | PR 26 | `npx vitest run src/test/repo-hygiene.test.ts` | `npm run build` then `npx vite preview`; `npx wrangler deploy --dry-run` | deploy files and README |
| 27 | Verification | PR 27 | `npm run check` | production preview plus user actions | docs edits only |

Every task is test-first from group 2 onward: RED (failing test, run and observe failure) before GREEN (implementation), then REFACTOR when needed. Commits are conventional, one per work unit story, no AI attribution. Creating commits, pushing or opening PRs requires explicit user authorization (`rules.apply`).

## Group 0: Baseline commit (no PR)

Lands `main` so PR branches have a base. Contents: `.gitignore` and `openspec/`. `.atl/` stays untracked unless the user decides otherwise.

- [x] 0.1 Create `.gitignore` covering `.env`, `.env.*` (except `.env.local.example`), `.dev.vars*`, `.wrangler/`, `dist/`, `node_modules/`. (`.atl/` is also ignored: it holds machine-specific absolute paths.)
- [x] 0.2 Verify no secret exists in `openspec/` (read-only scan of `openspec/`); with user approval commit `chore: initialize repository with SDD artifacts`, push `main`.
- [x] 0.3 Create the tracker branch (feature-branch-chain only) or confirm `main` as base (stacked-to-main), then branch `feat/bouquet-editor-01-scaffold`.

## Group 1: Scaffold, test runner, probes (PR 1)

Traceability: deployment (Production build); design D10, enables Strict TDD per `rules.tasks`.

- [x] 1.1 Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.nvmrc` (24), `.prettierrc` with scripts from D10, alias `@/`, strict flags.
- [x] 1.2 TypeScript 7 probe: install `typescript@7.0.2`, `typescript-eslint`, Vitest, Vite; accept only with no peer error and no `--force`, `--legacy-peer-deps` or `overrides`. Otherwise pin highest major in `npm view typescript-eslint peerDependencies` and repeat.
- [x] 1.3 RED: write `src/ui/atoms/Probe.test.tsx` (renders, queries by role); run, see it fail.
- [x] 1.4 GREEN: add `src/ui/atoms/Probe.tsx`, `src/main.tsx`, `src/test/setup.ts` (jest-dom).
- [x] 1.5 RED/GREEN jsdom probe in `src/test/pointer-probe.test.ts`: `PointerEvent` dispatch and `setPointerCapture` support; add the stub in `src/test/setup.ts` only if missing.
- [x] 1.6 Create `eslint.config.js`: `no-restricted-imports` per layer (D5), `Math.random` ban in domain and application, atoms/molecules/organisms barred from application contexts and containers.
- [x] 1.7 Create `.github/workflows/ci.yml` (read-only permissions, Node from `.nvmrc`, `npm ci`, `npm run check`, no secrets).
- [x] 1.8 Run `npm run check` green; flip `strict_tdd: true`, `testing.runner: vitest`, `testing.test_command: npm test`, layers and tool flags in `openspec/config.yaml`; hand off to orchestrator to re-run `sdd-init`.
- [x] 1.9 Write `docs/adr/0009-testing-stack-and-typescript.md` with the TypeScript probe outcome and a minimal `README.md` (quick start and scripts).

## Group 2: Geometry (PR 2)

Traceability: bouquet-model (Position bounds); bouquet-editor (Selection and transforms, transform handles).

- [x] 2.1 RED: `src/domain/geometry/geometry.test.ts` for `clientToModel`, `modelPerPixel` (viewBox `-500 -1000 1000 1300`, `xMidYMid meet`, letterboxing), angle normalization to `[0, 360)`.
- [x] 2.2 GREEN: `src/domain/geometry/{point,viewport,angle}.ts`.
- [x] 2.3 RED: gesture tests (move clamped to bounds, rotate delta about anchor, scale ratio clamped `[0.4, 2.5]`).
- [x] 2.4 GREEN: `src/domain/geometry/gestures.ts`; export from `src/domain/geometry/index.ts`.

## Group 3: Catalog (PR 3)

Traceability: catalog (Catalog size and categories, Per-flower color availability, Sample price disclosure data).

- [x] 3.1 RED: `src/domain/catalog/catalog.test.ts`: 8 flowers, 5 foliage, 5 wrappings; at least two colours when recolourable; first colour is default; `colors: []` for sunflower and lavender; integer COP prices; lookup by id.
- [x] 3.2 GREEN: `src/domain/catalog/{types,colors,data,lookup,index}.ts` with `as const` unions and the D3 hex values and prices.
- [x] 3.3 RED/GREEN: recolour-availability helper (colour outside list rejected) in `src/domain/catalog/lookup.ts`.

## Group 4: Bouquet operations (PR 4)

Traceability: bouquet-model (Renderer-independent structure, Element operations, Element limit, Position bounds, Layer order, Derived quantities).

- [x] 4.1 RED: `src/domain/bouquet/operations.test.ts`: add (clamped, default colour, id `e{n}` = max suffix + 1), limit 60 no-op for add and duplicate.
- [x] 4.2 GREEN: `src/domain/bouquet/{types,limits,ids,add}.ts`.
- [x] 4.3 RED/GREEN: transform (clamp, normalize, scale clamp), recolor (no-op outside list), duplicate (index + 1, offset 40/40, clamped), delete (unknown id no-op) in `src/domain/bouquet/operations.ts`.
- [x] 4.4 RED/GREEN: reorder forward, backward, front, back with ends no-op; `setWrapping` replace or clear; `clearBouquet` in `src/domain/bouquet/operations.ts`.
- [x] 4.5 RED/GREEN: derived quantity per `(catalogId, colorId)` in `src/domain/bouquet/quantities.ts`; add property check that no stored quantity field exists.
- [x] 4.6 Write `docs/adr/0002-bouquet-model.md`.

## Group 5: Bouquet validation (PR 5)

Traceability: draft-persistence (Safe handling of invalid data, validation half); bouquet-model (Renderer-independent structure).

- [x] 5.1 RED: `src/domain/bouquet/parse.test.ts` table: wrong version, over 60, bad or duplicate id, unknown or mismatched catalogId, non-finite number, anchor out of bounds, scale out of clamp, rotation outside `[0, 360)`, bad `colorId`, unknown wrapping, valid roundtrip.
- [x] 5.2 GREEN: `src/domain/bouquet/parse.ts` (`parseBouquet`, all-or-nothing); export from `src/domain/bouquet/index.ts`.

## Group 6: Pricing (PR 6)

Traceability: summary-pricing (Grouped summary, Single estimated total, Currency selection, USD rounding); catalog (Sample price disclosure data).

- [x] 6.1 RED: `src/domain/pricing/usd.test.ts`: 16 gives 0, 17 gives 1, 34000 gives 1000 cents; lines sum to total for tie cases (largest remainder, ties by summary order).
- [x] 6.2 GREEN: `src/domain/pricing/usd.ts` (`COP_PER_USD`, `toUsdCents`, `allocateUsdCents`).
- [x] 6.3 RED: `src/domain/pricing/summarize.test.ts`: groups flowers, foliage, wrapping, empty groups omitted, catalog order, quantity and line amounts, exactly one total.
- [x] 6.4 GREEN: `src/domain/pricing/summarize.ts`.
- [x] 6.5 Write `docs/adr/0006-pricing.md` (COP assumption pending user confirmation, rejected alternatives).

## Group 7: Composition core (PR 7)

Traceability: compositions (Six deterministic compositions, Apply then edit, shared mechanics).

- [x] 7.1 RED/GREEN: mulberry32 in `src/domain/composition/rng.ts` (seed determinism, range).
- [x] 7.2 RED/GREEN: ring-slot helper (K, T, `d`, partial ring spreading, n = 1 no division by zero) in `src/domain/composition/rings.ts`.
- [x] 7.3 RED/GREEN: lane helper on a quadratic Bezier (L, S, `t`, S = 1 midpoint) in `src/domain/composition/lanes.ts`.
- [x] 7.4 RED/GREEN: canonical ordering and `ItemRef`, `CompositionGenerator` types in `src/domain/composition/types.ts`.
- [x] 7.5 RED/GREEN: `applyComposition` in `src/domain/bouquet/compose.ts`: ids `e1..eN`, wrapping kept, count equals items, empty-for-compositions rule (wrapping-only counts as empty).
- [x] 7.6 Write `docs/adr/0004-compositions.md`.

## Group 8: Templates A (PR 8)

Traceability: compositions (Six deterministic compositions: Round, Compact, Asymmetric; Apply then edit).

- [x] 8.1 RED: `src/domain/composition/templates-a.test.ts`: splits (1,0), (0,1), (2,0), (1,1), (7,0), (20,40), (40,20), (60,0), (0,60), (1,59) and default set: one placement per item, anchors inside envelope, same input and seed deep-equal.
- [x] 8.2 GREEN: `src/domain/composition/templates/round.ts` and `compact.ts` with default sets; RED/GREEN assertions: Round mirrors about x = 0, Compact within 301 of `C`.
- [x] 8.3 GREEN: `src/domain/composition/templates/asymmetric.ts` with jitter and default set; test: farthest right anchor at least 1.5 times farthest left; two seeds differ.
- [x] 8.4 Add one inline golden snapshot per template (default set) in `src/domain/composition/templates-a.test.ts`.

## Group 9: Templates B and registry (PR 9)

Traceability: compositions (Six deterministic compositions: Wild, Long stems, Cascade; distinctness).

- [x] 9.1 RED: `src/domain/composition/templates-b.test.ts` with the same split table and envelope checks as 8.1.
- [x] 9.2 GREEN: `src/domain/composition/templates/wild.ts` (shuffled phyllotaxis, seeded jitter; two seeds differ).
- [x] 9.3 GREEN: `src/domain/composition/templates/longStems.ts` (flower abs(x) at most 200 and y at most -600 for default set).
- [x] 9.4 GREEN: `src/domain/composition/templates/cascade.ts` (six anchors with x > 0 and y > -420; lowest y > 100).
- [x] 9.5 RED/GREEN: `src/domain/composition/registry.ts` (`{ id, seed, defaultItems, generate }`) and distinctness test on shared lists of 2, 12, 60 items; inline goldens for B templates.

## Group 10: Editor reducer (PR 10)

Traceability: bouquet-model (Element operations, Layer order); bouquet-editor (Create and add items, Selection and transforms, Free composition); compositions (Apply then edit).

- [x] 10.1 RED: `src/application/editor/reducer.test.ts` for every action in D5 including no-op cases (limit, unknown id, bad colour, ends), selection on add and duplicate, `bouquet/clear` resets wrapping and selection, `composition/apply` clears selection.
- [x] 10.2 GREEN: `src/application/editor/{state,actions,reducer}.ts`.
- [x] 10.3 RED/GREEN: `selectSelectedElement`, `selectLayerPosition`, `selectCanAdd`, `selectSummary` in `src/application/editor/selectors.ts`.
- [x] 10.4 RED/GREEN: manual-only flow (add and move freely with no composition) in `src/application/editor/reducer.test.ts`.
- [x] 10.5 Write `docs/adr/0005-state-and-layers.md`.

## Group 11: Localization (PR 11)

Traceability: localization (Two languages, Initial language and persistence, language half); summary-pricing (Currency formatting).

- [x] 11.1 RED: `src/ui/i18n/i18n.test.tsx`: `en.ts` source type and `es.ts` satisfies it, `{name}` interpolation, `useT()` defaults to Spanish without provider, `<html lang>` switches.
- [x] 11.2 GREEN: `src/ui/i18n/{en,es,I18nContext,useT}.ts(x)` with the initial keys (catalog, colour, common, summary labels).
- [x] 11.3 RED: `src/ui/i18n/initialLanguage.test.ts` (stored, else browser es or en, else Spanish).
- [x] 11.4 GREEN: `src/ui/i18n/initialLanguage.ts`.
- [x] 11.5 RED/GREEN: `formatMoney` in `src/ui/i18n/formatMoney.ts`, pinning runtime strings (`COP 84.000` and `USD 24,71` for es-CO; `COP 84,000` and `USD 24.71` for en-US); record any difference in the test.
- [x] 11.6 Write `docs/adr/0007-localization.md`.

## Group 12: Persistence (PR 12)

Traceability: draft-persistence (Autosave and restore, Safe handling of invalid data); localization (Initial language and persistence, remembered language); summary-pricing (remembered currency).

- [ ] 12.1 RED: `src/infrastructure/local-storage/draftStore.test.ts` with fake `Storage`: save, load, corrupt JSON, unknown version, over 60, throwing storage, full storage; invalid data removes the key.
- [ ] 12.2 GREEN: `src/application/draft/ports.ts`, `src/infrastructure/local-storage/draftStore.ts`.
- [ ] 12.3 RED/GREEN: `src/application/preferences/ports.ts`, `src/infrastructure/local-storage/preferencesStore.ts` (`vouquet:prefs:v1`, language and currency, default COP).
- [ ] 12.4 RED/GREEN: debounced autosave 400 ms, flush on `visibilitychange` hidden and `pagehide` in `src/application/draft/autosave.ts` (fake timers).
- [ ] 12.5 Write `docs/adr/0008-draft-persistence.md`.

## Group 13: Flower illustrations (PR 13)

Traceability: catalog (Catalog size and categories: eight flowers; Per-flower color availability rendering).

- [ ] 13.1 RED: `src/ui/illustrations/flowers.test.tsx`: each flower renders a `<g>`, at most about 12 shapes, recolourable use `currentColor`, fixed ones hard-coded fill.
- [ ] 13.2 GREEN: `src/ui/illustrations/flowers/{Rose,Tulip,Peony,Carnation}.tsx`.
- [ ] 13.3 GREEN: `src/ui/illustrations/flowers/{Gerbera,Lily,Sunflower,Lavender}.tsx`.
- [ ] 13.4 GREEN: `src/ui/illustrations/flowers/index.ts` as `Record<FlowerId, ...>` (compile-time completeness).
- [ ] 13.5 Write `docs/adr/0003-catalog-and-illustrations.md`.

## Group 14: Foliage illustrations (PR 14)

Traceability: catalog (Catalog size and categories: five foliage).

- [ ] 14.1 RED: `src/ui/illustrations/foliage.test.tsx` (same shape and count assertions).
- [ ] 14.2 GREEN: `src/ui/illustrations/foliage/{Eucalyptus,Ruscus,Fern,Olive,DustyMiller}.tsx` and `index.ts` as `Record<FoliageId, ...>`.

## Group 15: Wrapping illustrations and registry (PR 15)

Traceability: catalog (Catalog size and categories: five wrappings); bouquet-model (wrapping as field).

- [ ] 15.1 RED: `src/ui/illustrations/wrappings.test.tsx`: each exports `Back` and `Front`.
- [ ] 15.2 GREEN: `src/ui/illustrations/wrappings/{Kraft,Ivory,Blush,Charcoal,Burlap}.tsx` and `index.ts` as `Record<WrappingId, ...>`.
- [ ] 15.3 RED/GREEN: `src/ui/illustrations/registry.ts` (`illustrationRegistry: Record<CatalogId, ...>`) and a test that every catalog id resolves.

## Group 16: Tokens and atoms (PR 16)

Traceability: bouquet-editor (Responsive tool layout foundations); design D9 identity; no spec behaviour beyond styling.

- [ ] 16.1 Create `src/ui/styles/tokens.css` (paper, surface, ink, muted, hairline, accent, danger, serif and sans stacks, focus ring, reduced motion) and global base in `src/ui/styles/base.css`.
- [ ] 16.2 RED/GREEN: `src/ui/atoms/Button` (44 px target, accessible name), `IconButton`, `SegmentedSwitch` with tests by role.
- [ ] 16.3 RED/GREEN: hand-authored icons in `src/ui/atoms/icons.tsx` (1.5 px stroke) with labels via `useT()`.
- [ ] 16.4 Write `docs/adr/0011-styling-and-identity.md`.

## Group 17: Canvas render (PR 17)

Traceability: bouquet-editor (Selection and transforms: visible selection, element labels); bouquet-model (Layer order).

- [ ] 17.1 RED: `src/ui/organisms/EditorCanvas/EditorCanvas.test.tsx`: draw order (background, wrapping back, stems, wrapping front, elements, overlay), wrapping `pointer-events: none`, `role="button"` elements named by item, colour, layer via `useT()`.
- [ ] 17.2 GREEN: `src/ui/organisms/EditorCanvas/EditorCanvas.tsx` and `stems.ts`.
- [ ] 17.3 RED/GREEN: selection overlay (frame, four corner handles, rotate handle, 44 px hit areas via `modelPerPixel`) in `src/ui/organisms/EditorCanvas/SelectionOverlay.tsx`; handles hidden with no selection.
- [ ] 17.4 Add the accessible-label keys to `src/ui/i18n/en.ts` and `src/ui/i18n/es.ts`.
- [ ] 17.5 Write `docs/adr/0001-svg-renderer.md`.

## Group 18: Gestures (PR 18)

Traceability: bouquet-editor (Selection and transforms: Move by touch, Rotate and scale handles, Deselect; Free composition).

- [ ] 18.1 RED: `src/ui/containers/useTransformGesture.test.tsx`: pointerdown selects and captures, move dispatches `element/transform`, pointerup and pointercancel end, background pointerdown dispatches `element/select` null.
- [ ] 18.2 GREEN: `src/ui/containers/useTransformGesture.ts` and `src/ui/containers/EditorCanvasContainer.tsx` (`ResizeObserver` viewport).
- [ ] 18.3 RED/GREEN: rotate and scale handle drags stay within bounds; `touch-action: none` asserted on the canvas.
- [ ] 18.4 Re-verify jsdom pointer-capture support from group 1 against the real hook; document any limits in `docs/adr/0001-svg-renderer.md`.

## Group 19: Palette and tap add (PR 19)

Traceability: bouquet-editor (Create and add items: Tap to add, wrapping chosen from palette); compositions (Apply then edit confirmation); catalog (Sample price disclosure).

- [ ] 19.1 RED: `src/ui/organisms/Palette/Palette.test.tsx`: tabs (Compositions, Flowers, Foliage, Wrapping), tap adds and selects, wrapping tab with "None" tile, composition tab default while no flowers or foliage.
- [ ] 19.2 GREEN: `src/ui/organisms/Palette/{Palette,PaletteTile}.tsx`, `src/ui/containers/PaletteContainer.tsx`.
- [ ] 19.3 RED/GREEN: golden-angle default anchor `defaultAnchor(k)` in `src/domain/geometry/defaultAnchor.ts` (at most 163 units, inside bounds).
- [ ] 19.4 RED/GREEN: inline confirm (`src/ui/molecules/InlineConfirm.tsx`) before applying a composition to a bouquet with flowers or foliage; Cancel leaves the bouquet unchanged; empty needs none.
- [ ] 19.5 Add palette keys to `src/ui/i18n/en.ts` and `src/ui/i18n/es.ts`.

## Group 20: Drag add (PR 20)

Traceability: bouquet-editor (Create and add items: Drag to add, Drop outside).

- [ ] 20.1 RED: `src/ui/containers/usePaletteDrag.test.tsx`: movement over 8 px starts drag, release inside SVG adds at pointer (clamped), release outside adds nothing, `pointercancel` and `Escape` cancel.
- [ ] 20.2 GREEN: `src/ui/containers/usePaletteDrag.ts` with ghost preview in `src/ui/molecules/DragGhost.tsx`.
- [ ] 20.3 RED/GREEN: palette `touch-action` on the scroll axis only; wrapping drop ignores position.

## Group 21: Selection toolbar (PR 21)

Traceability: bouquet-editor (Selection and transforms: Delete; Keyboard access: Button actions; Recolor).

- [ ] 21.1 RED: `src/ui/organisms/SelectionToolbar/SelectionToolbar.test.tsx`: row 1 (rotate, scale, layer), row 2 (swatches only for recolourable flowers, duplicate, delete), activation by keyboard.
- [ ] 21.2 GREEN: `src/ui/organisms/SelectionToolbar/SelectionToolbar.tsx`, `src/ui/containers/SelectionToolbarContainer.tsx`.
- [ ] 21.3 RED/GREEN: pure dock-side function (`y > -350` goes top) in `src/domain/geometry/dockSide.ts`; toolbar keeps side and ignores pointer events during a gesture.
- [ ] 21.4 RED/GREEN: recolour rose changes render colour; fixed-colour flower shows no swatches.
- [ ] 21.5 Add toolbar keys to `src/ui/i18n/en.ts` and `src/ui/i18n/es.ts`.

## Group 22: Keyboard and accessibility (PR 22)

Traceability: bouquet-editor (Keyboard access); design D9 extras.

- [ ] 22.1 RED: `src/ui/containers/useEditorShortcuts.test.tsx`: arrows 10 and Shift 50, `R`, `+`, `-`, `[`, `]`, Shift variants, `Delete`, Ctrl/Cmd+D, `Escape`.
- [ ] 22.2 GREEN: `src/ui/containers/useEditorShortcuts.ts`; focus selects the element.
- [ ] 22.3 RED/GREEN: polite live region in `src/ui/molecules/LiveRegion.tsx` and `prefers-reduced-motion` styles.

## Group 23: Summary and switches (PR 23)

Traceability: summary-pricing (all four requirements); catalog (Sample price disclosure); localization (Two languages switch).

- [ ] 23.1 RED: `src/ui/organisms/SummaryPanel/SummaryPanel.test.tsx`: groups, one "Estimated total" label (`summary.estimatedTotal`), sample-price notice (`summary.samplePricesNotice`), lines sum to total in USD.
- [ ] 23.2 GREEN: `src/ui/organisms/SummaryPanel/SummaryPanel.tsx`, `src/ui/containers/SummaryContainer.tsx` (formats with `formatMoney`).
- [ ] 23.3 RED/GREEN: currency and language switches with `PreferencesProvider` in `src/application/preferences/PreferencesProvider.tsx`; currency does not change the bouquet.
- [ ] 23.4 Re-confirm `formatMoney` output strings in the running UI and update pins if the runtime differs.

## Group 24: Header and app wiring (PR 24)

Traceability: bouquet-editor (Create and add items: New bouquet, New bouquet cancelled); draft-persistence (Autosave and restore); localization (Initial language and persistence).

- [ ] 24.1 RED: `src/app/App.test.tsx`: draft restored on start, autosave after change, invalid draft starts empty, New bouquet confirm and cancel (wrapping-only bouquet confirms), language and currency persist across remount.
- [ ] 24.2 GREEN: `src/app/App.tsx`, `src/app/providers.tsx`, `src/ui/organisms/Header/Header.tsx`, `src/main.tsx`.
- [ ] 24.3 RED/GREEN: reducer initial state from `DraftStore.load()` and `parseBouquet`; `<html lang>` updated on switch.

## Group 25: Responsive shell (PR 25)

Traceability: bouquet-editor (Responsive tool layout: Narrow viewport, Wide viewport).

- [ ] 25.1 RED: `src/ui/containers/AppShell.test.tsx`: at least 1024 px shows palette, canvas, summary together; below it a column with summary disclosure chip, canvas, palette sheet; empty-canvas hint points to Compositions.
- [ ] 25.2 GREEN: `src/ui/containers/AppShell.tsx`, `src/ui/containers/AppShell.module.css`.
- [ ] 25.3 Verify stacking order (summary disclosure, toolbar, canvas) and no horizontal scroll at 360 px and 1280 px in `npm run dev`; record observation in the PR body.

## Group 26: Deployment and documentation (PR 26)

Traceability: deployment (Production build, Automatic deploy from main, Preview separation, No committed secrets, Documented configuration). Agent tasks only; no secret enters the repository and nothing is deployed.

- [ ] 26.1 RED: `src/test/repo-hygiene.test.ts`: `.env.local.example` lines are `KEY=` with empty values, no `VITE_` keys, no non-allowlisted `import.meta.env.VITE_*`, `.gitignore` ignores `.env.local`.
- [ ] 26.2 GREEN: `.env.local.example` (`CLOUDFLARE_API_TOKEN=`, `CLOUDFLARE_ACCOUNT_ID=`, one comment each); confirm `.gitignore`.
- [ ] 26.3 Create `wrangler.jsonc` (`name` "vouquet", `compatibility_date`, `assets.directory` "./dist"); add `wrangler` as a dev dependency and the `deploy:local` script.
- [ ] 26.4 Verify `deploy:local` invocation with `npx wrangler deploy --dry-run` (no credentials, no upload); confirm how `node --env-file=.env.local` is passed and record in the README.
- [ ] 26.5 Verify, from Cloudflare documentation, supported Node versions for `.nvmrc` (24 versus Workers Builds image) and the default non-production deploy command; record sources in `docs/adr/0010-cloudflare-deployment.md`.
- [ ] 26.6 Write full `README.md` per D12: layer map, model, how to add a catalog item or composition, dashboard steps, preview and production behaviour, credentials table (where each is stored), `.env.local` copy step, sample-price notice, ADR index.
- [ ] 26.7 Write `docs/adr/0010-cloudflare-deployment.md`.

## Group 27: Final verification (PR 27)

Traceability: deployment (Production build, Documented configuration); whole change.

- [ ] 27.1 Run `npm ci && npm run check` from a clean tree: typecheck, lint, test, build green with no build errors.
- [ ] 27.2 Serve the production build with `npx vite preview` and run the full flow: add, move, rotate, scale, recolour, composition apply, summary, reload restore.
- [ ] 27.3 Confirm every required variable is documented in `README.md` and no secret exists in tracked files (hygiene test plus `git ls-files` review).
- [ ] 27.4 Walk the spec scenario list (65) against passing tests; record any scenario covered only manually in the PR body.
- [ ] 27.5 Update `README.md` and ADRs with any verification result that changed a stated default (Intl strings, `.nvmrc`, deploy command).

### User actions (not agent tasks)

- [ ] U1 Decide whether `.atl/` is committed; approve commits, pushes and PR creation.
- [ ] U2 In the Cloudflare dashboard connect `canamejoy/VouquetPage` (GitHub App limited to that repository), set build command `npm run check`, deploy command default per README; confirm the non-production deploy command and `.nvmrc` acceptance.
- [ ] U3 Optional: create a custom token (Workers Scripts: Edit, one account, expiry), copy `.env.local.example` to `.env.local`, fill both values, run `npm run deploy:local` to confirm token sufficiency.
- [ ] U4 Run the manual deploy smoke on a real touch device: perpendicular-drag `touch-action` behaviour, page does not scroll over the canvas, preview URL leaves production unchanged.
- [ ] U5 Confirm COP as the sample-price base currency and the "New bouquet" confirmation rule for a wrapping-only bouquet.
