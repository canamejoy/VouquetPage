# ADR 0008: Draft persistence

Status: accepted (slice 12, persistence).

## Context

The editor keeps one bouquet draft in the browser and remembers the language and currency. Stored
data is untrusted: it can be corrupt, from another version, or edited by hand. Storage can also
be unavailable or full.

## Decision

- Two ports in `application` (`DraftStore`, `PreferencesStore`); the `local-storage` adapters in
  `infrastructure` implement them. They are the only storage boundaries, so `ui` never reads
  `localStorage`.
- Draft: key `vouquet:draft:v1`, the `Bouquet` as JSON. `load()` runs `JSON.parse` then
  `parseBouquet`; any failure (corrupt JSON, unknown version, over 60 elements, invalid element)
  removes the key and returns `null`, so the editor starts empty without a notice. No partial
  salvage and no migrations: only version 1 exists.
- Preferences: key `vouquet:prefs:v1`, `{ language, currency }`. Each field is validated on its
  own; an invalid language is `null` (the caller resolves it from the browser) and an invalid
  currency is `COP`.
- Every adapter operation catches storage errors, including a `null` storage when access is
  denied, and the editor keeps working without persistence.
- Autosave (`createDraftAutosave`) is a plain debounce of 400 ms, flushed on `visibilitychange`
  (hidden) and `pagehide`, because the page can close inside the debounce window.
- `Language` and `Currency` moved to `application/preferences/ports.ts`, because the preferences
  port needs them and `application` may not import `ui`; `ui/i18n` re-exports them.

## Consequences

- A tampered draft silently loses the user's work instead of partially restoring a bouquet they
  never made.
- Two tabs overwrite each other's draft (last writer wins); acceptable for one small document.
- Wiring the providers and the switch controls arrives in later slices.
