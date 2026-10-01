# Deployment Specification

## Purpose

Automated Cloudflare delivery from GitHub with safe handling of credentials.

## Requirements

### Requirement: Production build

A clean install followed by the production build MUST succeed, with test, typecheck and lint also passing.

#### Scenario: Clean build
- GIVEN a fresh checkout
- WHEN dependencies are installed and the build runs
- THEN it exits successfully and produces deployable output

### Requirement: Automatic deploy from main

A push to `main` MUST deploy to production on Cloudflare without manual steps.

#### Scenario: Push to main
- GIVEN a merged change on `main`
- THEN production is updated automatically

### Requirement: Preview separation

Non-`main` branches SHOULD get preview deployments that MUST NOT affect production.

#### Scenario: Feature branch
- GIVEN a push to another branch
- THEN a preview is produced and production is unchanged

### Requirement: No committed secrets

The public repository MUST NOT contain secrets. Local credentials files MUST be git-ignored, with a committed example template containing placeholders only.

#### Scenario: Secret hygiene
- GIVEN the repository
- THEN no credential values are tracked and the local env file is ignored

### Requirement: Documented configuration

The README MUST document required credentials, environment variables, dashboard connection steps and the preview/production behavior.

#### Scenario: Setup docs
- GIVEN the README
- THEN every variable the deployment needs is listed with its purpose
