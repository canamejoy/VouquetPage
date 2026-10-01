# VOUQUET

VOUQUET is an interactive web editor for designing flower bouquets in 2D. This repository holds
the MVP, built as a chain of small reviewable slices.

## Quick start

Requires Node 24 (see `.nvmrc`).

```sh
npm install
npm run dev
```

## Scripts

| Script               | What it does                                             |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | Start the Vite dev server                                |
| `npm test`           | Run the test suite once (Vitest)                         |
| `npm run test:watch` | Run Vitest in watch mode                                 |
| `npm run typecheck`  | Type-check with `tsc --noEmit`                           |
| `npm run lint`       | ESLint, then Prettier in check mode                      |
| `npm run build`      | Type-check, then produce the production build in `dist/` |
| `npm run check`      | Typecheck, lint, test and build; this is what CI runs    |

## Architecture notes

Source lives in `src/` with a layer rule enforced by ESLint (`eslint.config.js`): `domain`
imports nothing, `application` imports `domain`, `ui` and `infrastructure` import `application`
and `domain`, and `app` imports everything.

Decisions are recorded in `docs/adr/`:

- [0009 Testing stack and TypeScript version](docs/adr/0009-testing-stack-and-typescript.md)
