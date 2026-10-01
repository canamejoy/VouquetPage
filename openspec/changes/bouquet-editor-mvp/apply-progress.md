# Apply Progress: bouquet-editor-mvp

Mode: Strict TDD (runner Vitest 5, `npm test`). Delivery: auto-chain, stacked-to-main.

## Batch 1: Group 1, slice 1 "Scaffold, test runner, probes" (tasks 1.1 to 1.9)

Branch `feat/bouquet-editor-01-scaffold` (base `main` at 58e6c33). Status: 9/9 tasks of Group 1 complete. Groups 2 to 27 pending.

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
