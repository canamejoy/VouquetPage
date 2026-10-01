# Localization Specification

## Purpose

Spanish and English interface, user-switchable.

## Requirements

### Requirement: Two languages

All user-visible text, including catalog names, composition names, labels and notices, MUST be available in Spanish and English. A missing translation MUST NOT display a raw key.

#### Scenario: Switch language
- GIVEN the UI in Spanish
- WHEN the user selects English
- THEN all visible text changes to English without reload and the bouquet is unchanged

#### Scenario: Completeness
- GIVEN both languages
- THEN every translation key exists in both

### Requirement: Initial language and persistence

The initial language SHOULD follow the browser language when it is Spanish or English, otherwise default to Spanish. The user's choice SHOULD be remembered across reloads.

#### Scenario: Remembered
- GIVEN the user chose English
- WHEN the page reloads
- THEN the UI is English

#### Scenario: Unsupported browser language
- GIVEN a browser language of French and no saved choice
- THEN the UI is Spanish

## Resolved questions

- The initial language follows the browser when it is Spanish or English and is Spanish otherwise; the user's choice is remembered. Confirmed by the user on 2026-09-30.
