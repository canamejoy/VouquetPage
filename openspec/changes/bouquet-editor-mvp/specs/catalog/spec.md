# Catalog Specification

## Purpose

The set of available flowers, foliage and wrappings, with colors and sample prices.

## Requirements

### Requirement: Catalog size and categories

The catalog MUST provide about 8 flower types, 5 foliage types and 5 wrappings, each with a localized name, an illustration and a sample price authored in COP. Illustrations MUST be generated vector art.

#### Scenario: Counts
- GIVEN the catalog
- WHEN items are grouped by category
- THEN there are 8 flowers, 5 foliage and 5 wrappings, each with a positive price

### Requirement: Per-flower color availability

Each item MUST declare its own available colors. Recolorable flowers (e.g. roses) MUST list at least two colors and a default; non-recolorable ones (e.g. sunflowers) MUST list none and MUST NOT offer a color choice.

#### Scenario: Rose offers colors
- GIVEN a rose is selected
- WHEN the color options are shown
- THEN the rose's available colors are listed

#### Scenario: Sunflower offers none
- GIVEN a sunflower is selected
- WHEN the properties are shown
- THEN no color control is shown

#### Scenario: Color outside the list
- GIVEN a rose
- WHEN a color not in its list is requested
- THEN the color is unchanged

### Requirement: Sample price disclosure

Prices MUST be identified to the user as sample data.

#### Scenario: Disclosure visible
- GIVEN the summary is shown
- THEN a sample-prices notice is visible in the active language
