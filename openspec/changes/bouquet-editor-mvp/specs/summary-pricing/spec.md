# Summary and Pricing Specification

## Purpose

A grouped summary and one estimated total, derived from the bouquet model, in COP or USD.

## Requirements

### Requirement: Grouped summary

The summary MUST list flowers, foliage and wrapping in separate groups, with item name, color where applicable, quantity and line price, derived from the model and never from the rendered image. Empty groups SHOULD be omitted.

#### Scenario: Grouping
- GIVEN 2 roses, 1 fern and 1 wrapping
- THEN the summary shows a flowers group (rose x2), a foliage group (fern x1) and a wrapping group

#### Scenario: Empty bouquet
- GIVEN an empty bouquet
- THEN the summary shows no items and a total of zero

#### Scenario: Updates live
- GIVEN a displayed summary
- WHEN an element is added or deleted
- THEN the summary updates without reload

### Requirement: Single estimated total

Exactly one total MUST be shown, labelled as estimated, equal to the sum of line prices.

#### Scenario: Total matches lines
- GIVEN any bouquet
- THEN the displayed total equals the sum of displayed line prices in the active currency

### Requirement: Currency selection

The user MUST be able to choose COP or USD. Prices are authored in COP; USD MUST use the fixed rate 3400 COP = 1 USD. The selection MUST NOT alter the bouquet. The selected currency SHOULD be remembered across reloads; the initial currency MUST be COP.

#### Scenario: Currency remembered
- GIVEN the user chose USD
- WHEN the page reloads
- THEN amounts are shown in USD

#### Scenario: Default currency
- GIVEN no saved choice
- THEN amounts are shown in COP

#### Scenario: Switch to USD
- GIVEN a bouquet totalling 34000 COP
- WHEN USD is selected
- THEN the total reads 10 USD

#### Scenario: Currency independent of bouquet
- WHEN currency is switched back and forth
- THEN the bouquet elements are unchanged

#### Scenario: Formatting
- GIVEN a language and currency
- THEN amounts use that currency's symbol or code and the language's number formatting

### Requirement: USD rounding

The USD total MUST be the COP total converted at 3400 COP = 1 USD and rounded half up to the cent, once, on the total. USD line amounts MUST sum exactly to the displayed total.

#### Scenario: Exact conversion
- GIVEN a bouquet totalling 34000 COP
- WHEN USD is selected
- THEN the total reads 10.00 USD

#### Scenario: Rounding on the total
- GIVEN three lines of 1000 COP each (total 3000 COP, 0.88235... USD)
- WHEN USD is selected
- THEN the total reads 0.88 USD and the displayed USD lines sum exactly to 0.88

## Resolved questions

- USD rounding was decided in design: round half up to the cent, once, on the total, with line amounts adjusted so they sum exactly to it.
