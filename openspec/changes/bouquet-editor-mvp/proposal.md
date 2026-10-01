# Proposal: Bouquet Editor MVP

## Intent

VOUQUET's core is interactive bouquet design, not a flower shop. The repository is greenfield. Deliver a 2D editor to compose, edit and price a bouquet on desktop and touch, built on a renderer-independent model that later 3D, AR and AI work can reuse.

## Scope

### In Scope
- Editor: add by drag or tap; move, rotate, scale, duplicate, delete, reorder layers.
- Generated SVG catalog: about 8 flowers, 5 foliage, 5 wrappings; colors per flower (roses recolorable, sunflowers not).
- Six rule-based compositions (Round, Compact, Asymmetric, Wild, Long stems, Cascade), editable after applying.
- Summary and one estimated total; COP/USD selector, fixed 3400 COP = 1 USD.
- Spanish/English UI, user-switchable.
- localStorage autosave of one draft.
- Responsive UI, README, ADRs, Cloudflare deploy from `main`.

### Out of Scope
- Undo/redo, authentication, payments, backend, AI, 3D, AR, e-commerce.
- Export/import, share links, decoration picker, E2E suite.
- Fields or interfaces prepared for roadmap features.

**Assumption (orchestrator, not user-stated; confirm at review):** prices are authored in COP, converted to USD, and marked as sample data.

## Capabilities

### New Capabilities
- `bouquet-model`: structure, element operations, layer order.
- `catalog`: items, per-flower colors, sample prices.
- `bouquet-editor`: palette, canvas, selection, transforms.
- `compositions`: deterministic templates, apply then edit.
- `summary-pricing`: line items, estimated total, currency.
- `localization`: Spanish/English switching.
- `draft-persistence`: autosave and restore.
- `deployment`: Cloudflare delivery, environments, secrets hygiene.

### Modified Capabilities
None.

## Approach

Proposed direction, finalised in design:
- Rendering: SVG + Pointer Events with hand-built handles (comparison in exploration 3.1); Konva is the fallback behind `EditorCanvas`.
- Model: one `elements[]` with `kind`; array order is depth; normalized coordinates; `schemaVersion: 1`; quantities derived.
- Compositions: pure generators with a seeded PRNG behind one generator type.
- State: pure reducer + Context. Pricing: integer minor units.
- i18n mechanism decided in design; no dependency assumed.
- Tests: Vitest, Testing Library, jsdom.
- Deploy: Workers static assets via Workers Builds; previews per branch; CI runs checks only.
- The first task group scaffolds the project and test runner, then flips `strict_tdd` to true.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json`, `tsconfig*.json`, `vite.config.ts` | New | Scaffold, scripts |
| `src/{domain,application,ui,infrastructure,app}` | New | Editor |
| `wrangler.jsonc`, `.github/workflows/` | New | Deploy, checks |
| `.gitignore`, `.env.local.example` | New | Local credentials template |
| `README.md`, `docs/adr/` | New | Documentation |
| `openspec/config.yaml` | Modified | `strict_tdd: true` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TypeScript 7 toolchain compatibility unverified | Med | Check at scaffold; fall back to 5.x/6.x |
| Hand-built transform handles | Med | Test-first pure geometry; Konva fallback |
| Art quality bounds product identity | Med | Early style review; swappable assets |
| Strict TDD unenforceable before scaffold | High | Scaffold first |
| Workers Builds dashboard behaviour | Low | Deploy smoke task |

## Rollback Plan

Revert the change's commits; nothing pre-existing to restore. Cloudflare: redeploy the previous Worker version or disconnect the build; no destructive changes. Drafts with unknown versions are discarded.

## Dependencies

- The user connects the repository in the Cloudflare dashboard; required credentials are documented in the README.

## Success Criteria

- [ ] Every MVP editor action works with mouse and touch.
- [ ] Each composition is deterministic and editable.
- [ ] Summary and total match the bouquet in COP and USD.
- [ ] Language switch and draft restore work.
- [ ] Test, typecheck, lint and build pass; `main` auto-deploys; no secrets committed.
