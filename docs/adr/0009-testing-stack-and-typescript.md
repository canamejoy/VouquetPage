# ADR 0009: Testing stack and TypeScript version

Status: accepted (slice 1, scaffold)

## Context

The MVP needs a test runner that shares the Vite pipeline, renders SVG in a DOM and supports
Strict TDD from the first feature slice. The design (D10) also required verifying whether
`typescript@7.0.2` can be used with `typescript-eslint`, instead of assuming it.

## Decision

- Test runner: Vitest 5 with jsdom, Testing Library (`@testing-library/react`, `jest-dom`,
  `user-event`). Component tests query by role and accessible name.
- Linting and formatting: ESLint 10 with `typescript-eslint` and built-in
  `no-restricted-imports` for the layer rule, plus Prettier.
- TypeScript: **6.0.3**, not 7.0.2. The TypeScript 7 probe failed (see below).
- Scripts: `test` is `vitest run`; `check` runs typecheck, lint, test and build in that order.

### TypeScript 7 probe (observed, 2026-10-01)

Acceptance rule: `typescript@7.0.2` is accepted only if `npm install` completes with no peer
dependency error and without `--force`, `--legacy-peer-deps` or `overrides`.

Attempt 1, `typescript@7.0.2` with `typescript-eslint@8.71.0`, `eslint@10.11.0`, `vite@8.3.1`,
`vitest@5.0.3`:

```
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error Found: typescript@7.0.2
npm error Could not resolve dependency:
npm error peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.71.0
```

`npm view typescript-eslint peerDependencies` reports `typescript: '>=4.8.4 <6.1.0'`, so the
latest `typescript-eslint` (8.71.0) does not support any 7.x release. The probe is rejected.
No flag or override was used to force it.

Attempt 2, the highest major inside the peer range: `typescript@6.0.3` (latest 6.0.x on npm)
with the same other packages. `npm install` completed with no peer error and no flags;
`npm run check` is green (typecheck, lint, 5 tests, build).

Resolved versions: typescript 6.0.3, typescript-eslint 8.71.0, eslint 10.11.0, vite 8.3.1,
vitest 5.0.3, jsdom 30.1.1, react 19.3.0, prettier 3.9.9.

Consequence of TypeScript 6: the `baseUrl` option is deprecated there and would stop working
in 7.0, so `tsconfig.json` uses `paths` without `baseUrl`.

Revisit when `typescript-eslint` widens its peer range to include 7.x.

### jsdom probe (observed with jsdom 30.1.1)

`src/test/pointer-probe.test.ts` records what jsdom supports:

| Capability                                                                          | Result                                |
| ----------------------------------------------------------------------------------- | ------------------------------------- |
| `new PointerEvent(...)` with `pointerId`, `clientX`, `clientY`                      | Supported                             |
| Dispatching a `PointerEvent` to a listener                                          | Supported                             |
| `Element.prototype.setPointerCapture`, `hasPointerCapture`, `releasePointerCapture` | **Missing** (`typeof` is `undefined`) |

`src/test/setup.ts` therefore installs a minimal stub that tracks captured pointer ids per
element. It is installed only when the method is absent. It does not model implicit release on
`pointerup` or on element removal.

## Alternatives

- Jest: a separate transform pipeline for the same result.
- Vitest browser mode with Playwright: real layout, but a browser download in CI and a slower
  loop. Deferred.
- `typescript@7.0.2` with `--legacy-peer-deps` or `overrides`: rejected, it would hide an
  unsupported combination.

## Consequences

- Every slice after this one is test-first with `npm test`.
- The TypeScript version is held at 6.0.x until the lint toolchain supports 7.x.
- Gesture tests can rely on pointer events and the capture stub, but real touch behaviour is
  verified manually on a device.
