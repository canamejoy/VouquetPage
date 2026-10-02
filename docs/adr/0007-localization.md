# ADR 0007: Localization

Status: accepted (slice 11, localization).

## Context

The interface is available in Spanish and English, switchable at runtime. The design budgets about
90 strings and two languages, so a message-format library would add more machinery than content.

## Decision

- `en.ts` is the source dictionary. Its keys define `TranslationKey`; `es.ts` is declared
  `satisfies Record<TranslationKey, string>`, so a missing or extra key is a compile error. A test
  also asserts both key sets are equal.
- Keys are flat dotted strings. `catalog.<id>` and `color.<id>` stay separate namespaces because
  the wrapping id `blush` and the colour id `blush` are the same string. Composition names and
  descriptions are `composition.<id>.name` and `composition.<id>.description`.
- `useT()` returns `t(key, params?)`, with `{name}` interpolation. Copy avoids plural forms.
- The i18n Context defaults to Spanish, so presentational components render without a provider.
  `I18nProvider` also keeps `<html lang>` in sync with the language.
- `resolveInitialLanguage(stored, browserLanguages)` is pure: stored choice, else the first
  browser language that is Spanish or English, else Spanish. Reading storage and
  `navigator.languages` belongs to the caller.
- `formatMoney(amount, currency, language)` uses `Intl.NumberFormat` with `currencyDisplay: 'code'`.
  COP takes whole pesos and USD takes cents. Locales are `es-CO` and `en-US`.
- Pinned runtime output (Node 26): `COP 84.000` and `USD 24,71` for Spanish, `COP 84,000` and
  `USD 24.71` for English. The space after the code is a non-breaking space (U+00A0).

## Alternatives

- i18next with react-i18next: two dependencies whose namespaces, lazy loading and plural rules go
  unused.
- FormatJS or Lingui: an ICU parser or compile step for two static languages.

## Consequences

- No dependency is added. Adding a language means one new dictionary and one union member.
- Output of `Intl` depends on the runtime's ICU data; the pinned strings fail visibly if it changes.
- Checked in a real browser (Chrome 153, slice 27): the production build produced the same strings the tests pin under Node: `COP\u00a013,000` and `USD\u00a03.82` for English, `COP\u00a013.000` and `USD\u00a03,82` for Spanish, each with a non-breaking space after the code.
- Persisting the language choice and the switch control arrive in later slices.
