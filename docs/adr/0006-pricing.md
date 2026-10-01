# ADR 0006: Pricing

Status: accepted (slice 6, pricing). The COP base currency is an assumption pending user confirmation.

## Context

The summary shows one estimated total in COP or USD. Prices are sample data. The displayed USD
lines must add up to the displayed USD total, and rounding must be predictable and testable.

## Decision

- Catalog prices are whole-COP integers. COP amounts are never rounded.
- `COP_PER_USD = 3400` is the single rate constant, in `domain/pricing`.
- The USD total is integer cents, rounded once on the COP total, half up:
  `toUsdCents(cop) = floor((cop + 17) / 34)`. 16 COP gives 0, 17 gives 1, 34000 gives 1000.
- USD lines are allocated by largest remainder: each line gets `floor(lineCop / 34)` cents and
  the missing cents go one each to the lines with the largest `lineCop % 34`. Ties go to the
  earlier line.
- `summarize(bouquet, catalog)` returns groups (flowers, foliage, wrapping; empty groups
  omitted) of lines keyed by `(catalogId, colorId)`. Lines follow catalog order, colours follow
  the flower's colour list, and that order is also the allocation and tie-break order.
- The domain returns integers only (COP and US cents). Formatting with `Intl.NumberFormat` and
  the currency code happens at the UI edge.
- Assumption: COP is the base currency and the sample prices are whole pesos. This is pending
  user confirmation; changing it only touches catalog data and the rate constant.

## Alternatives

- Convert each line separately and sum: the total drifts from the converted total (three lines
  of 1000 COP would show 0.87 USD against 0.88).
- Round every line and show their sum as the total: breaks the rule that rounding happens once
  on the total.
- Floating-point USD amounts: rounding errors and unpredictable half cases; integers are exact.
- Truncate or round half even: the spec fixes round half up on the total.
- Store prices in USD: the product is priced in COP and USD is a derived view.

## Consequences

- Lines always sum to the total in both currencies, so the UI can display them as they are.
- A line can be one cent away from its exact share; that is the cost of an exact sum.
- The rate is fixed; a live rate would need a new port and is out of scope.
