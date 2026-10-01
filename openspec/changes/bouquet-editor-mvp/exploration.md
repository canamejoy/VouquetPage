## Exploration: bouquet-editor-mvp (2D bouquet editor MVP for VOUQUET)

Date: 2026-09-30. Artifact language: English. Store mode: hybrid.

### 1. Current State
- The repository is greenfield. It has no commits, no `package.json`, no source and no test runner.
- Only `.atl/` and `openspec/` exist, both untracked.
- `openspec/config.yaml` records `strict_tdd: false` with `strict_tdd_intent: true`. It flips once a workspace test command exists. `testing.runner_candidate` is `vitest`, not yet decided.
- Rule for proposal: do not decide the rendering technology without a documented comparison. Rules for design: justify the test runner and rendering approach, and define a workspace-level test command.
- Rule for tasks: the first task group scaffolds the project and test runner.
- Toolchain: Node v26.8.2 and npm 11.19.1. Both satisfy Vite 8's engines (`^20.19.0 || >=22.12.0`) and Wrangler's (`>=22`).
- Remote: `git@github.com:canamejoy/VouquetPage.git` (empty, public). Public repo means no secrets may ever be committed.

Verified versions (npm registry, checked 2026-09-30):

| Package | Version | Notes |
|---|---|---|
| react / react-dom | 19.3.0 | |
| react-konva | 19.3.0 | peer `react ^19.3.0`, `konva ^7.2.5 \|\| ^8 \|\| ^9 \|\| ^10`. Deps: its-fine, react-reconciler 0.34.0, scheduler 0.28.0. Tied to React's minor version. |
| konva | 10.7.0 | ~1.87 MB unpacked, no production deps. Optional peers `canvas`/`skia-canvas` for Node. |
| fabric | 7.4.0 | ~22 MB unpacked (optional jsdom/canvas deps). |
| vite | 8.3.1 | |
| vitest | 5.0.3 | peer vite `^6.4 \|\| ^7 \|\| ^8`. |
| typescript | 7.0.2 | See risks. |
| wrangler | 4.145.0 | node >=22. |

### 2. Affected Areas
Everything is new. The proposed top-level layout (details in section 5):
- `package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html`: scaffold.
- `src/`: application code.
- `wrangler.jsonc`: deploy config.
- `README.md`, `docs/adr/`: documentation and decisions.
- `.gitignore`, `.env.local.example`: secrets hygiene.
- `openspec/config.yaml`: flip `strict_tdd` after scaffold.

### 3. Topic comparisons

#### 3.1 2D rendering and interaction technology

| Criterion | DOM/SVG (+ Pointer Events) | Konva + react-konva | Fabric.js 7 | Raw Canvas 2D | Others (Pixi, tldraw SDK) |
|---|---|---|---|---|---|
| Move/rotate/scale handles | Hand-build (~150-250 LOC of pure, testable math plus an overlay) | Built-in `Transformer` | Built-in controls | Hand-build everything | Pixi: none. tldraw: heavy and a licensing concern. |
| Z-order | Array order or `z-index` | `moveUp/Down/ToTop` | Built-in | Manual | Built-in |
| Hit testing | Native DOM events (free, pixel-accurate on SVG shapes) | Built-in (hit canvas) | Built-in | Manual math or offscreen picking | Built-in |
| Touch/responsive | Pointer Events unify mouse/touch/pen. `touch-action: none` needed on the canvas. Scales via `viewBox`. | Supported | Supported | Manual | Supported |
| React model | Native. Elements are plain JSX. | Custom reconciler, tied to React minor | Imperative, awkward in React | Imperative | Imperative |
| Testing under Strict TDD | Excellent. Renders in jsdom and is queryable with Testing Library. | Weak. Needs the `canvas` native module or a real browser (the project's own tests use Playwright). | Weak, same issue (optional jsdom/canvas) | Weak | Weak |
| Accessibility | Real DOM: focusable elements, ARIA labels, keyboard moves possible | Canvas is opaque to assistive tech | Same | Same | Same |
| Bundle | 0 KB | ~1.9 MB unpacked (minified runtime is far smaller, not measured) | Largest (~22 MB unpacked) | 0 KB | Pixi is large |
| Vector art quality | Native SVG, crisp at any zoom | SVG must be rasterized to `Image` or converted to `Path` data | Has SVG loader, awkward | Same as Konva | Rasterized |
| Export to image | Serialize SVG to canvas or PNG (small helper) | `toDataURL` built-in | Built-in | Built-in | Built-in |
| Maintenance health | Platform standard | Active (v19.3.0 tracks React 19.3) | Active (v7) | n/a | n/a |
| Model/renderer separation | Natural. Renderer is a pure function of Bouquet. | Good if disciplined | Fabric's object model competes with the app model | Natural | Poor |

Analysis:
- The MVP scene is tens of elements, not thousands, so canvas performance advantages do not apply.
- The vector-art nature of the product (hand-authored flowers) and the Strict TDD goal both favour SVG. Jsdom testing is the decisive factor against the canvas libraries.
- Konva's real advantage is the free `Transformer`. That advantage is real but is roughly one task's worth of work.
- react-konva's hard coupling to React's minor version (`^19.3.0`) is an upgrade-friction risk.
- Fabric is rejected: heaviest, imperative, and its own object model fights the structured Bouquet.
- Raw Canvas is rejected: reimplements hit testing and handles with no testing benefit.
- Pixi is rejected as a game-oriented engine. tldraw is rejected as heavy for the MVP, with licensing unknown (not verified).

Recommendation: SVG scene rendered by React with Pointer Events and a hand-built selection overlay (handles). Konva + react-konva is the documented fallback if profiling shows a performance or fidelity problem. Keep the renderer behind a narrow boundary (`EditorCanvas` takes Bouquet + selection + callbacks) so a swap is local. This is not a speculative abstraction. It is simply the container-presentational split.

#### 3.2 Structured Bouquet model

| Option | Pros | Cons |
|---|---|---|
| A. Separate `flowers[]`, `foliage[]`, `decorations[]` arrays (matches the brief's tree) | Mirrors the conceptual tree. Easy per-kind queries. | Z-order across kinds is awkward (layer ordering interleaves kinds). Duplicated element logic. |
| B. Single `elements[]` with a `kind` discriminant (flower, foliage, decoration), plus a `wrapping` field and `metadata` | One ordering and one layer concept. Move/rotate/scale/duplicate/delete code written once. Derived selectors give `flowers`, `foliage`. | Slight deviation from the literal tree (selectors restore it). |

Recommendation: B. The elements array order IS the z-order, with no separate `layer` number to keep in sync. Expose `selectFlowers/selectFoliage` as derived views. The brief says "conceptually", so B honours it.

Proposed shape (illustrative, to be finalised in spec/design):
```ts
interface Bouquet {
  schemaVersion: 1;
  elements: BouquetElement[];        // array order = back-to-front
  wrapping: WrappingChoice | null;
  metadata: { name?: string; compositionId?: string; createdAt?: string };
}
interface BouquetElement {
  id: string;
  kind: 'flower' | 'foliage' | 'decoration';
  catalogId: string;                 // species/variant reference into the catalog
  position: { x: number; y: number };   // normalized design space
  rotation: number;                  // degrees, clockwise
  scale: number;
  color?: string;                    // variant override
}
```

Decisions:
- Coordinates: use a normalized, resolution-independent design space (e.g. a fixed logical canvas such as 1000x1000 units with origin at the bouquet binding point). Do not use screen pixels, so the model is independent of viewport and responsive layouts.
- Map to the future 3D renderer: 3D can add `z` and a 3D rotation later. Do NOT add `z`, quaternions or stem geometry now (speculative).
- Layer/depth: array order, as above. No `layer` field in the MVP.
- Quantity: do not store a `quantity` per element for the MVP. Each placed element is one stem, because duplicate is a first-class action. Summary and price derive quantities by counting by `catalogId`. A `quantity` field would create two ways to represent the same thing. If a later product flow needs "bunch of 5", model it as an element group then.
- Schema versioning: include `schemaVersion: 1` only. It is nearly free and is needed once localStorage or JSON import/AI output exists. A migration framework is overengineering.
- AI future: the AI output will target this same type. Validation at import (a small hand-written type guard or a schema library) is a seam. Do not add the schema library until persistence/import needs it.
- `decorations[]`: the MVP user flow has no decoration picker. Keep `kind: 'decoration'` in the union only if the catalog contains decorations. Otherwise omit it and add it when needed (the discriminated union makes that cheap). Recommended default: omit now.

#### 3.3 Composition templates

- Each template is a pure, deterministic function: `(params, rng) => BouquetElement[]`. Params include the available catalog items and counts.
- Randomness: use a seeded PRNG passed as an argument (small hand-written mulberry32-style function, no dependency), so results are reproducible and unit-testable. This addresses the "not random positions" requirement: templates are rule-based layouts (radial rings for Round, tight rings for Compact, offset centroid for Asymmetric, jittered cluster for Wild, vertical stagger for Long stems, diagonal falloff for Cascade). Seeded jitter varies the look, but the same seed yields the same result.
- Registry: a static list `{ id, name, description, generate }`. "Pick a recommended composition and modify it afterwards" is naturally satisfied: the generator output is just a Bouquet that the user edits.
- Seam for later optimization/AI: define the single type `type CompositionGenerator = (input: CompositionInput) => Bouquet['elements']`. An optimizer or an AI service later implements the same type (sync now; the async variant can be added when needed). Do not build async plumbing, plugin systems, or scoring now.
- Tests: golden-style assertions on invariants (element count, bounds inside the canvas, determinism for fixed seed, ordering). Cheap and high value.

#### 3.4 State management and architecture

| Option | Pros | Cons |
|---|---|---|
| `useReducer` + Context | No dependency. Reducer is a pure function (ideal for Strict TDD). Sufficient for one editor screen. | Re-render breadth, manageable at this size. |
| Zustand | Tiny, ergonomic selectors, easy middleware (persist, undo via history) | A dependency. Not needed at this scale. |
| Redux Toolkit / others | Mature | Overkill |

Recommendation: a pure reducer (`editorReducer(state, action) => state`) tested without React, exposed through a small hook plus Context. Zustand is a reasonable swap later because the reducer logic is store-agnostic.

Undo/redo: not in the stated MVP list. It is a high-value design-tool feature, but it is outside the list. With a pure reducer, snapshot-based history is cheap to add later. Do not build it in the MVP. Flag as an unresolved question (low cost to add; user's call). Recommended default: defer.

Folder architecture (screaming, light hexagonal, atomic design only for UI):
```
src/
  domain/            # pure TS, zero React/DOM: Bouquet types, element ops, pricing, summary
    bouquet/  catalog/  composition/  pricing/
  application/       # editor state: reducer, actions, selectors (pure)
  ui/                # React: atoms/ molecules/ organisms/ (containers connect state; presentational get props)
  infrastructure/    # adapters: localStorage repository, assets loader
  app/               # composition root, routing (none needed), providers
```
- Dependency rule: domain depends on nothing. The application depends on the domain. UI depends on the application and domain. Infrastructure implements ports defined by the application.
- Ports: introduce a port only where there are two implementations or an I/O boundary (persistence). No ports for pure logic.
- Atomic design: use the atoms/molecules/organisms folders only inside `ui/`, grown as needed. Do not pre-create empty tiers or templates/pages tiers.

#### 3.5 Visual assets

| Option | Pros | Cons | Licensing |
|---|---|---|---|
| Hand-authored SVG (stylized, layered petals, 2-3 tints per flower) | Crisp at any scale, themeable color variants through CSS variables or props, tiny, native to the SVG renderer, unique identity | Requires design effort and taste. Realism limited. | Fully owned |
| Procedural shapes (parametric petals generated in code) | Infinite variants, tiny | Hard to make beautiful and tends toward generic | Owned |
| Raster PNG/WebP | Photorealistic possible | Large, no recoloring, blurry on scale, need sourcing | Depends on source |
| Emoji | Zero effort | Inconsistent across platforms, cheap look, contradicts identity | Platform fonts |
| Third-party illustration packs | Fast | Licensing review, consistent style hard, often not recolorable | Must verify per pack |

Recommendation: hand-authored stylized SVG components, with a small set of 4-6 flowers, 2-3 foliage types, and 3 wrappings in a consistent illustration style, using color variants via props. Stylized elegant vector art supports the "design tool, not flower shop" identity better than photos. The art source (who draws it) is a product decision (section 8). Gate on art style review early because it dominates perceived quality.

#### 3.6 Catalog and pricing
- Catalog: a static, typed TypeScript module (`domain/catalog`) of flowers, foliage and wrappings: `{ id, name, kind, unitPrice (integer minor units), colors[], asset }`. No JSON fetch, no backend. A repository interface is not needed yet.
- Pricing: a pure function `estimatePrice(bouquet, catalog)` = sum of unit prices per placed stem (counted by `catalogId`) + wrapping price, returned as integer minor units and formatted at the edge with `Intl.NumberFormat`. Label it "estimated".
- Keep money as integers (cents) to avoid float drift. Currency and rounding rules are a product decision (section 8).
- Summary: `summarize(bouquet, catalog)` returns grouped line items (name, count, subtotal) for flowers, foliage and wrapping. Pure and tested.

#### 3.7 Persistence
- Brief: the MVP says no complex database, and nothing requires saving.
- Options: (a) none, (b) localStorage autosave of the current draft, (c) JSON export/import, (d) shareable URL.
- Cost: (b) is ~30 lines behind a `BouquetRepository` port, because the model is already a serializable plain object, and it prevents losing work on refresh. (c) is cheap but adds UI. (d) needs size handling.
- Recommendation: (b) localStorage autosave of one draft with `schemaVersion` check, discarding unknown or invalid versions. Defer export/import. If the user prefers strictly minimal, (a) is acceptable. This is a product decision (section 8).

#### 3.8 Testing

| Choice | Notes |
|---|---|
| Runner: Vitest 5 | Shares Vite config, native TS/ESM, jsdom environment, fast watch. Peer range supports Vite 8. Recommended. |
| Component tests: Testing Library (`@testing-library/react`, `user-event`, `jest-dom`) with jsdom | Works well with the SVG renderer. Pointer interactions can be tested as events plus pure math tests for handle geometry. |
| E2E: Playwright | Not justified for the MVP's test pyramid. Domain and reducer tests carry most value. Consider ONE smoke test later, only if the team wants to guard drag behaviour in a real browser. Jsdom has no layout, so `getBoundingClientRect`-dependent drag math must be isolated in pure functions that receive coordinates. |
| Lint/format | ESLint (typescript-eslint) and Prettier or equivalent. Verify compatibility with TypeScript 7 before pinning. |

Workspace-level commands to enable Strict TDD: `npm test` (= `vitest run`), `npm run typecheck` (= `tsc --noEmit`), `npm run lint`, `npm run build`. After scaffold, flip `strict_tdd: true` in `openspec/config.yaml` and re-run `sdd-init`. Strict TS flags: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.

Test priorities (in order of value): domain functions (element ops, pricing, summary), composition generators, reducer, then component tests for palette, summary, and canvas interactions.

#### 3.9 Deployment on Cloudflare (verified against current docs)

Findings:
- Pages is not declared deprecated, but Cloudflare's migration guide positions Workers (with static assets) as the forward-looking platform: broader feature set, with Pages keeping unique features (Branch Deploy Controls, Custom Branch Aliases).
- Workers Builds replaces Pages' built-in CI/CD. Production branch builds create a version and promote it. Non-production branches produce Preview builds with preview URLs posted as PR comments.
- Workers Builds configuration: build command (e.g. `npm run build`), deploy command (default `npx wrangler deploy`), preview command (default `npx wrangler preview`), root directory, branch (default `main`). The Worker name in the dashboard must match `name` in the Wrangler config.
- Build variables and secrets are available during builds only (separate from runtime variables). Cloudflare injects `CI`, `WORKERS_CI`, `WORKERS_CI_BRANCH`, etc.
- A pure Vite SPA does not need the Cloudflare Vite plugin. Use `wrangler.jsonc` with `assets.directory = ./dist` and `not_found_handling = "single-page-application"`.
- Pages Direct Upload warns you cannot switch to Git integration later.

| Option | Pros | Cons |
|---|---|---|
| 1. Workers static assets + Workers Builds (Git integration) | Recommended direction by Cloudflare. No tokens in repo or in GitHub. Auto deploy from `main`. Preview URLs for branches/PRs. | Preview/branch configuration is more explicit. Fewer pre-made env toggles than Pages. |
| 2. Pages + Git integration | Simplest dashboard flow. Branch deploy controls. | Not the direction of investment. |
| 3. GitHub Actions + `cloudflare/wrangler-action@v4` | Full control, tests gate deploys (CI runs `npm test` before deploy) | Requires a Cloudflare API token stored as a GitHub secret. More to maintain. |
| 4. Pages Direct Upload | Manual | No Git integration, cannot switch later. |

Recommendation: Option 1 for hosting, plus a separate lightweight GitHub Actions workflow that only runs `typecheck`, `lint` and `test` (no Cloudflare credentials needed). Environments: production = `main`; preview = every non-production branch and PR (provided by Workers Builds). A separate "development" environment is the local dev server. Do not create a staging Worker until there is a reason. If tests must gate deployment, move to Option 3.

Credentials, exactly:
- Option 1 (Workers Builds): no API token needs to be created or stored locally. The user does in the dashboard: Workers & Pages > Create > Import a repository > authorize Cloudflare's GitHub app for `canamejoy/VouquetPage` > set build command `npm run build`, production branch `main`. Cloudflare auto-generates the build API token (Workers Scripts, KV, R2, routes permissions) or the user may supply their own. App env variables, if any, are set in the dashboard (build variables for build-time values, since Vite inlines `VITE_*` at build time). Nothing secret may use `VITE_` prefix because it ships to the browser. The MVP needs none.
- Option 3 (GitHub Actions): two GitHub repository secrets, `CLOUDFLARE_API_TOKEN` (custom token with permission "Edit Cloudflare Workers", scoped to the single account) and `CLOUDFLARE_ACCOUNT_ID`.
- Local manual deploy (optional, for the requested "local credentials file"): a gitignored `.env.local` (template `.env.local.example` committed with empty values) containing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Wrangler reads these from the environment, so a tiny `npm run deploy:local` script or `wrangler` run with `.env` loaded works. `.gitignore` must cover `.env*` (except the example) and `.dev.vars`.
- Not verified in this session: the exact token permission name for Pages Direct Upload (`Cloudflare Pages: Edit` per memory only). Irrelevant if Option 1 is chosen.

Sources:
- https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- https://developers.cloudflare.com/workers/vite-plugin/
- https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://github.com/konvajs/react-konva
- npm registry JSON for react-konva, konva, fabric, vite, vitest, react, typescript and wrangler (checked 2026-09-30)

#### 3.10 Responsive and touch UX
- Desktop (>= ~1024 px): three panels: left palette (tabs Flowers / Foliage / Wrapping), center canvas, right summary and price. Header "VOUQUET". Additions beyond the reference: a floating contextual toolbar near the selected element (duplicate, delete, forward/back) and a compositions picker (a "Start from a composition" gallery in the palette or an initial empty-state overlay).
- Tablet/mobile: canvas takes the full width. Palette becomes a bottom sheet (tabs + horizontal scroll of items). Summary becomes a collapsible top or bottom sheet with the price always visible as a chip. The selection toolbar stays near the element and large (44 px touch targets).
- Interaction: Pointer Events with `touch-action: none` on the canvas, capture the pointer on drag, two-finger pinch/rotate on the selected element is a stretch goal (handles first). Tap-to-add as an alternative to drag-from-palette (drag from a scrolling sheet is unreliable on touch). Keyboard: arrow keys nudge, Delete removes, accessible labels on elements.
- The SVG `viewBox` plus the normalized model coordinates keeps the design identical across screen sizes.

### 4. Approaches summary
1. **SVG/DOM renderer + reducer + pure domain** (recommended)
   - Pros: no render dependency, jsdom-testable, vector art, accessible, clean model/renderer separation.
   - Cons: hand-built handles, scaling beyond hundreds of elements needs care.
   - Effort: Medium.
2. **Konva + react-konva**
   - Pros: Transformer, hit canvas, PNG export, strong ecosystem.
   - Cons: canvas not testable in jsdom, rasterized SVG art, React-minor coupling, accessibility gap, extra dependency.
   - Effort: Medium (faster to handles, slower to test).
3. **Fabric.js 7**
   - Pros: feature-rich editor object model.
   - Cons: heaviest, own object model, imperative.
   - Effort: Medium-High.
4. **Raw Canvas 2D**
   - Pros: no dependency.
   - Cons: reimplement everything, untestable.
   - Effort: High.

### 5. Recommendation
Approach 1 across all topics as detailed above. Concrete MVP stack: React 19, TypeScript strict, Vite 8, Vitest 5 + Testing Library + jsdom, ESLint + Prettier, plain CSS (modules or a single design-token stylesheet; no UI library or Tailwind needed unless the user prefers), `useReducer`, Cloudflare Workers static assets via Workers Builds. Document each decision as a short ADR under `docs/adr/` (rendering, model shape, coordinates, deployment, state). Update README with run/test/deploy instructions and credentials.

Deliberately not built (YAGNI): 3D fields, AI interfaces, async generators, plugin registries, undo/redo, auth, backend, schema library, migration framework, E2E suite, decoration picker.

### 6. Risks
- TypeScript 7.0.2 as `latest`: toolchain (typescript-eslint, Vitest, Vite) compatibility unverified. Mitigation: verify during scaffold, fall back to the latest 5.x/6.x line if needed.
- Hand-built rotate/scale handles: pointer math, touch quirks and gizmo UX are the main engineering risk. Mitigation: pure geometry functions tested first (Strict TDD), handles as a single overlay component.
- Art quality and consistency drive the product identity more than any library choice.
- If performance or fidelity problems appear with SVG, migration to Konva is possible because the Bouquet model and reducer are renderer-independent.
- Drag from palette on touch devices: use tap-to-add plus drag where supported.
- Cloudflare Workers Builds is newer than Pages Git integration and its dashboard behaviour (name matching, preview commands) may need a trial deploy. Mitigation: first task group includes a deploy-smoke task.
- Strict TDD cannot be enforced until the scaffold exists. Mitigation: the first task group scaffolds the runner before features (already in config rules).

### 7. Open questions (technical, resolvable in design)
- TypeScript major version pin after a toolchain compatibility check.
- Styling approach (plain CSS tokens vs CSS Modules).
- Canvas logical size and origin convention (e.g. binding point at bottom-center).
- Whether wrapping is rendered in front of or behind stems (wrapping is drawn over the stem bottoms in front of the stems and below the blooms is the likely visual; decide in design).
- Seeded PRNG implementation and how composition parameters (stem counts, palette) are chosen.

### 8. Unresolved product decisions

1. **UI language.**
   - Question: Should the interface copy be Spanish, English, or both?
   - Options: (a) Spanish only. (b) English only. (c) Both with i18n.
   - Consequences: (a)/(b) are simplest. (c) adds an i18n dependency, keys and test surface, which is not needed for the MVP.
   - Recommended default: choose one language now (the user's target audience decides) and keep all copy in one typed constants module so that adding i18n later is mechanical. Artifacts and code remain in English.

2. **Currency and meaning of the estimated price.**
   - Question: Which currency and format, and is the price a single estimate or a range?
   - Options: (a) Single total in one fixed currency (e.g. EUR or USD or COP). (b) Single total plus an "estimated" disclaimer only. (c) A range (e.g. +/- 10%).
   - Consequences: (a)/(b) are trivial. (c) adds a rule that has no source of truth yet.
   - Recommended default: (b), a single total in one currency, labelled "estimated", with placeholder prices that are clearly marked as sample data until the real catalog prices are provided.

3. **Catalog content and art source.**
   - Question: Which flowers, foliage and wrappings are in the MVP catalog, with what prices, and who produces the illustrations?
   - Options: (a) The implementing agent designs a stylized SVG set (4-6 flowers, 2-3 foliage, 3 wrappings) with invented names/prices. (b) The user supplies a list and/or artwork. (c) Use a licensed third-party illustration pack.
   - Consequences: (a) is fastest but quality is bounded and the art is a placeholder. (b) gives the best fit but blocks on delivery. (c) needs license review and may not be recolorable.
   - Recommended default: (a) for the MVP with explicit placeholder status, while keeping each asset a swappable catalog entry.

4. **Persistence.**
   - Question: Should the MVP remember the user's bouquet?
   - Options: (a) Nothing. (b) localStorage autosave of one draft. (c) b + JSON export/import. (d) Shareable link.
   - Consequences: (a) loses work on refresh. (b) is cheap and invisible. (c)/(d) add UI and validation surface.
   - Recommended default: (b).

5. **Undo/redo.**
   - Question: Include undo/redo in the MVP?
   - Options: (a) No. (b) Yes (snapshot history).
   - Consequences: (a) keeps scope to the stated list, and designers will miss it. (b) adds roughly a small task with a pure reducer but extra behaviours to specify and test.
   - Recommended default: (a), defer, because it is not in the stated MVP list. It is cheap to add later with the reducer design.

### 9. Does a dedicated `sdd-research` lane add value?
Marginal. Most technical questions are already settled with verified evidence. One question would benefit from a bounded lane, only if the user wants extra certainty before design: "Do the SVG pointer-event handles (rotate/scale gizmo with pinch on touch) reach acceptable UX and test coverage compared with Konva Transformer?" This is best answered by a short spike during design/apply (first scaffold task) rather than a separate research lane. A second optional question is TypeScript 7 toolchain compatibility (typescript-eslint, Vitest, Vite 8), which is a quick check at scaffold time. Recommendation: skip `sdd-research` and go to proposal, after the five product decisions are answered or accepted as defaults.

### 10. Ready for Proposal
Yes, once the orchestrator has relayed the "Unresolved product decisions" (section 8) to the user. The proposal should carry the recommended defaults if the user accepts them. The proposal should also state: the first task group scaffolds React/TS/Vite/Vitest and a workspace `npm test`, flips `strict_tdd` to true, and includes a Cloudflare deploy smoke test and a `.gitignore`/`.env.local.example` for credentials.
