# VOUQUET

VOUQUET is an interactive web editor for designing flower bouquets in 2D. You pick flowers,
foliage and a wrapping from a palette, arrange them on a canvas, and see one estimated total in
Colombian pesos (COP) or US dollars (USD). This repository holds the MVP.

**Quick path:** `npm ci`, then `npm run dev`. To put it online, follow [Deploy to Cloudflare](#deploy-to-cloudflare).
To paste your Cloudflare keys locally, follow [Credentials](#credentials-and-environment-variables).

## What the MVP does and does not do

| It does                                                                   | It does not                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Edit one bouquet: add, move, rotate, scale, recolour, reorder, duplicate  | Sign-in, payments, orders or any backend                     |
| Start from one of six compositions (it asks before replacing your work)   | AI suggestions, 3D, AR, export, import or share links        |
| Show a live estimated total, in COP or USD (fixed 3400 COP = 1 USD)       | Undo or redo                                                 |
| Switch between Spanish and English; remember language, currency and draft | Use real prices: **every price is sample data, not a quote** |
| Autosave one draft in the browser (`localStorage`); restore it on reload  | Sync drafts between devices or browsers                      |

## Quick start

Requires Node 24 (see `.nvmrc`).

```sh
npm ci
npm run dev
```

## Scripts

| Script                 | What it does                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                                                             |
| `npm test`             | Run the test suite once (Vitest)                                                      |
| `npm run test:watch`   | Run Vitest in watch mode                                                              |
| `npm run typecheck`    | Type-check with `tsc --noEmit`                                                        |
| `npm run lint`         | ESLint, then Prettier in check mode                                                   |
| `npm run build`        | Type-check, then produce the production build in `dist/`                              |
| `npm run check`        | Typecheck, lint, test and build; this is what CI and the Cloudflare build run         |
| `npm run deploy:local` | Optional manual deploy: runs `check`, then Wrangler `deploy` with `.env.local` loaded |

## Using the editor

| Area     | How it works                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| Palette  | Tabs for flowers, foliage, wrappings and compositions. Click or tap an item to add it, or drag it onto the canvas |
| Canvas   | Drag an element to move it; use the handles to rotate and scale. Click empty space to deselect                    |
| Toolbar  | Appears with a selection: rotate, smaller, larger, send backward, bring forward, duplicate, delete, colour        |
| Summary  | Lists the items and the estimated total; on narrow screens it collapses into a disclosure                         |
| Language | Spanish or English, set from the browser first (Spanish if neither); the header switch overrides it               |
| Currency | COP or USD in the header; COP first                                                                               |
| Autosave | The bouquet is saved to the browser shortly after each change and restored on reload; "New bouquet" clears it     |

Keyboard shortcuts act on the selected element:

| Keys                    | Action                                            |
| ----------------------- | ------------------------------------------------- |
| Arrows, with Shift      | Nudge by 10 model units, or by 50                 |
| `R`, with Shift         | Rotate by 15 degrees, clockwise or back           |
| `+` / `-`               | Scale up or down one step                         |
| `[` / `]`, with Shift   | Send backward or forward, or to the back or front |
| `Ctrl+D` or `Cmd+D`     | Duplicate                                         |
| `Delete` or `Backspace` | Remove                                            |
| `Escape`                | Deselect                                          |

## Architecture overview

Source lives in `src/`. A layer rule enforced by ESLint (`eslint.config.js`) keeps the
dependencies pointing inward.

| Layer                | Holds                                                                    | May import              |
| -------------------- | ------------------------------------------------------------------------ | ----------------------- |
| `src/domain`         | Pure TypeScript: bouquet model, catalog, compositions, pricing, geometry | nothing                 |
| `src/application`    | Editor reducer and selectors, preferences, draft autosave logic          | `domain`                |
| `src/infrastructure` | `localStorage` access                                                    | `application`, `domain` |
| `src/ui`             | React components (atoms to organisms), containers, translations, styles  | `application`, `domain` |
| `src/app`            | The composition root: wires providers, storage and the editor            | everything              |

- **The bouquet is a structured, renderer-independent model**: an ordered `elements[]` (array
  order is depth) plus at most one wrapping. Quantities and totals are derived, never stored. SVG is
  only how the model is drawn.
- **Catalog and prices** live in `src/domain/catalog/data.ts` (sample data, whole COP). To add an
  item, add it there, add its illustration and its translated name, and the tests will point at
  anything missing.
- **Compositions** live in `src/domain/composition/` as deterministic templates registered in
  `registry.ts`. To add one, write a template, register it with a seed, and add its translated name.
- **Pricing** is in `src/domain/pricing`: the total is exact in COP and rounded once for USD.

Decisions are recorded in `docs/adr/`:

| ADR                                                   | Topic                                |
| ----------------------------------------------------- | ------------------------------------ |
| [0001](docs/adr/0001-svg-renderer.md)                 | SVG renderer and Pointer Events      |
| [0002](docs/adr/0002-bouquet-model.md)                | Bouquet model                        |
| [0003](docs/adr/0003-catalog-and-illustrations.md)    | Catalog and illustrations            |
| [0004](docs/adr/0004-compositions.md)                 | Compositions                         |
| [0005](docs/adr/0005-state-and-layers.md)             | Editor state and layers              |
| [0006](docs/adr/0006-pricing.md)                      | Pricing                              |
| [0007](docs/adr/0007-localization.md)                 | Localization                         |
| [0008](docs/adr/0008-draft-persistence.md)            | Draft persistence                    |
| [0009](docs/adr/0009-testing-stack-and-typescript.md) | Testing stack and TypeScript version |
| [0010](docs/adr/0010-cloudflare-deployment.md)        | Cloudflare deployment                |
| [0011](docs/adr/0011-styling-and-identity.md)         | Styling and visual identity          |

## Testing

Tests are written first (Strict TDD): a failing test, then the code that passes it, then cleanup.
`npm test` runs Vitest with jsdom and Testing Library; components are queried by role and
accessible name. jsdom has no layout, so geometry is tested with explicit coordinates, and there
is no browser end-to-end suite. `src/test/repo-hygiene.test.ts` guards the repository: the
credentials template must hold only empty `KEY=` lines, no `VITE_` variable may be added without
an allowlist entry, `.env.local` must stay ignored, and no tracked file may hold something shaped
like a Cloudflare token or account id. It runs in `npm test`, so it also runs in CI and in the
Cloudflare build.

## Deploy to Cloudflare

The app is a static site, hosted as a Cloudflare Worker with static assets and built by Workers
Builds straight from GitHub. `wrangler.jsonc` describes it (assets in `./dist`, Worker name
`vouquet`). The build command `npm run check` runs typecheck, lint, tests and the build, so a
failing test blocks the deploy and **no Cloudflare secret is stored in GitHub**.

You do these steps once, in the Cloudflare dashboard. Nothing here was run for you.

1. Open **Workers & Pages**, then **Create**, then **Import a repository**.
2. Authorize the Cloudflare GitHub app for **only `canamejoy/VouquetPage`** ("Only select repositories").
3. Set the Worker name to **`vouquet`**. It must match `name` in `wrangler.jsonc`.
4. Set the build command to **`npm run check`**.
5. Keep the default deploy command (`npx wrangler deploy`).
6. Set the production branch to **`main`**.
7. Leave non-production branch builds enabled, and save.

| Branch or event        | What happens                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| Push to `main`         | Workers Builds runs `npm run check`, then deploys to production   |
| Any other branch or PR | Preview build with its own preview URL; production is not changed |
| Local `npm run dev`    | Development; no Cloudflare resource is involved                   |

`wrangler.jsonc` sets `not_found_handling` to `single-page-application`, so unknown paths serve
`index.html`. There is one Worker and no staging environment. To roll back, redeploy a previous
Worker version from the dashboard or disconnect the build.

## Credentials and environment variables

**To paste your Cloudflare keys locally:** copy the template and fill it in. `.env.local` is
gitignored, so it never reaches the public repository.

```sh
cp .env.local.example .env.local
# edit .env.local and paste the two values
npm run deploy:local   # only when you want a manual deploy
```

Create `.env.local` first. `deploy:local` loads it with `node --env-file`, which fails when the
file is missing.

| Credential                          | Needed?                         | Minimal permission                                                                               | Where it lives                            |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Cloudflare GitHub app authorization | Yes, for dashboard deploys      | "Only select repositories": `canamejoy/VouquetPage`                                              | GitHub and Cloudflare; nothing to paste   |
| Build API token                     | Yes, for dashboard deploys      | Generated by Cloudflare when you connect the repository                                          | Cloudflare account only; nothing to paste |
| CI checks (GitHub Actions)          | No                              | None; the workflow is read-only and has no secrets                                               | Nowhere                                   |
| `CLOUDFLARE_API_TOKEN`              | Only for `npm run deploy:local` | Custom token: Account > Workers Scripts > Edit, one account, no zone permissions, with an expiry | `.env.local` (gitignored)                 |
| `CLOUDFLARE_ACCOUNT_ID`             | Only for `npm run deploy:local` | An identifier, not a secret; find it in the dashboard                                            | `.env.local` (gitignored)                 |

**Environment variables the app needs at build or run time: none.** The MVP reads no
`import.meta.env` variable. If one is ever needed, set it in the Worker's build settings in the
dashboard, not in the repository.

> **Warning:** Vite inlines every `VITE_`-prefixed variable into the browser bundle, where anyone
> can read it. Never give a secret a `VITE_` name. The hygiene test rejects `VITE_` keys in
> `.env.local.example` and any unlisted `import.meta.env.VITE_*` read.

## Not yet verified

These need you or a real environment; the project does not claim them.

- [ ] The dashboard flow above on your account (it was written from Cloudflare's documentation and not run).
- [ ] That the `.nvmrc` value (`24`) is accepted by the Workers Builds image.
- [ ] The default deploy command used for non-production branches (the exploration recorded `npx wrangler preview` as the default; not re-checked against the dashboard).
- [ ] That the token permission "Workers Scripts > Edit" is enough for `deploy:local`.
- [ ] Touch behaviour on a real device (gestures, the palette sheet, the toolbar).
