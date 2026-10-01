# Compositions Specification

## Purpose

Recommended arrangements the user applies and then keeps editing.

## Requirements

### Requirement: Six deterministic compositions

The system MUST offer Round, Compact, Asymmetric, Wild, Long stems and Cascade. Each MUST be rule/template based and deterministic: identical inputs MUST yield an identical bouquet. Compositions MUST be visibly distinct from one another.

#### Scenario: Determinism
- GIVEN the same selected items and composition
- WHEN it is applied twice
- THEN both resulting bouquets are equal

Distinct positions are required when the bouquet has 2 or more items; with a single item two templates MAY coincide.

#### Scenario: Distinct layouts
- GIVEN the same 2 or more selected items
- WHEN each composition is applied
- THEN no two produce the same element positions

#### Scenario: Single item
- GIVEN a bouquet with one item
- WHEN two compositions are applied
- THEN their positions MAY coincide

### Requirement: Apply then edit

Applying a composition MUST produce an ordinary bouquet that remains fully editable. Applying it to a bouquet with flowers or foliage MUST replace the existing flower and foliage arrangement while preserving the chosen wrapping, and MUST require an inline confirmation. An empty bouquet (no flower or foliage elements; a wrapping-only bouquet counts as empty) MUST NOT require confirmation and MUST use a default item set. Element anchors MUST lie inside the model bounds.

#### Scenario: Edit after apply
- GIVEN a Round composition applied
- WHEN an element is moved and deleted
- THEN the bouquet reflects those edits

#### Scenario: Empty bouquet
- GIVEN an empty bouquet
- WHEN Cascade is applied
- THEN a default-populated Cascade bouquet appears

#### Scenario: Wrapping-only counts as empty
- GIVEN a bouquet with only a wrapping
- WHEN a composition is applied
- THEN no confirmation is requested and the default item set is used with the wrapping kept

#### Scenario: Apply declined
- GIVEN a bouquet with flowers
- WHEN a composition is applied and the confirmation is cancelled
- THEN the bouquet is unchanged

#### Scenario: Bounds
- GIVEN any composition
- WHEN applied
- THEN every element anchor lies inside the model bounds

## Resolved questions

- Applying a composition replaces the flower and foliage arrangement, keeps the wrapping, and uses a default item set when the bouquet is empty. Confirmed by the user on 2026-09-30.
