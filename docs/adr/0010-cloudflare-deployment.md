# ADR 0010: Cloudflare deployment

Status: accepted (slice 26); two facts checked against documentation on 2026-10-01 (slice 27); dashboard behaviour not yet verified on the owner's account

## Context

The repository is public, and the MVP is a static single-page app built by Vite. It must deploy
to Cloudflare from GitHub on every push to `main`, give other branches a preview that cannot touch
production, and keep every secret out of the repository (spec: deployment).

## Decision

- **Workers static assets, built by Workers Builds** from the connected GitHub repository.
  `wrangler.jsonc` declares the Worker `vouquet` (keep it equal to the Worker name in the dashboard),
  `assets.directory` `./dist` and `not_found_handling` `single-page-application`. There is no script,
  no binding, no route and no `account_id`.
- **Tests gate deploys.** The Cloudflare build command is `npm run check`, so a type, lint or test
  failure stops the deploy. No Cloudflare token is stored in GitHub; the CI workflow has read-only
  permissions and no secrets.
- **Environments.** Production is `main`; every other branch and PR gets a preview build; development
  is the local dev server. There is no staging Worker.
- **Optional local deploy.** `npm run deploy:local` runs `check`, then Wrangler `deploy` with
  `node --env-file=.env.local`. `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` live only in the
  gitignored `.env.local`, created from the committed `.env.local.example` (empty values).
- **`wrangler` is a dev dependency** (4.146.0 when added; needs Node 22 or later), so local deploys
  and the dry run use the locked version.
- **Enforced hygiene.** `src/test/repo-hygiene.test.ts` fails if the template holds a value or a
  `VITE_` key, if an unlisted `import.meta.env.VITE_*` is read, if `.env.local` is not ignored, or
  if a tracked file holds a token-shaped or account-id-shaped assignment.

## Alternatives considered

| Option                                | Why not                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| Pages with Git integration            | Works, but Cloudflare positions Workers with static assets as the forward platform |
| GitHub Actions with a Wrangler action | Needs an API token stored as a GitHub secret in a public repository                |
| Pages direct upload                   | No Git integration, and it cannot be switched to Git integration later             |

## Consequences

- Connecting the repository is a one-time dashboard task for the owner; the README lists the steps.
- Checked locally: `npm run build` followed by `npx wrangler deploy --dry-run` reads the four assets
  from `dist/` and exits without login or upload.
- Verified from Cloudflare documentation on 2026-10-01 (summarised page fetch, not account-tested):
  the Workers Builds image defaults to Node.js 24.18.0, preinstalls 22.23.2 and 24.18.0 and selects
  the version from `NODE_VERSION` or `.nvmrc` / `.node-version`, so `.nvmrc` `24` is supported
  (https://developers.cloudflare.com/workers/ci-cd/builds/build-image/). The production deploy
  command defaults to `npx wrangler deploy`; non-production branches run a Preview command
  (default `npx wrangler preview`, which does not promote to production) when preview builds are
  enabled, and the page does not say they are enabled by default; the build command is optional
  (https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
- Not verified, because only the owner's account can confirm them: the dashboard flow, whether
  preview builds are enabled, whether the dashboard Worker name must equal `wrangler.jsonc`
  `name` (the configuration page is silent), which install command the image runs, and whether the
  `Workers Scripts > Edit` token permission is sufficient for `deploy:local`.
- Design drift: D11 omitted `not_found_handling` because the app has no client routes; it is set
  anyway, following the exploration, so a reload on any path serves the app.
- Rollback: redeploy a previous Worker version from the dashboard, or disconnect the build.
- Sources: the two documentation pages above, plus Cloudflare documentation for single-page-application
  routing as cited in the exploration (section 3.9).
