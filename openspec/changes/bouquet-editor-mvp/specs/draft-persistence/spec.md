# Draft Persistence Specification

## Purpose

Autosave and restore of one bouquet draft in the browser.

## Requirements

### Requirement: Autosave and restore

The system MUST automatically save the current bouquet as a single draft in localStorage after changes, and MUST restore it on load. Saved data MUST carry a schema version.

#### Scenario: Restore
- GIVEN an edited bouquet
- WHEN the page reloads
- THEN the same bouquet is shown

#### Scenario: Single draft
- GIVEN a saved draft
- WHEN a new bouquet is created and edited
- THEN the stored draft is the new bouquet only

### Requirement: Safe handling of invalid data

Stored data that is unparsable, has an unknown or unsupported version, or fails validation MUST be discarded and the editor MUST start empty without errors. If storage is unavailable or full, the editor MUST keep working.

#### Scenario: Unknown version
- GIVEN stored data with an unknown schema version
- WHEN the app loads
- THEN it starts empty and the invalid data is discarded

#### Scenario: Corrupt JSON
- GIVEN stored text that is not valid JSON
- THEN the app starts empty with no crash

#### Scenario: Storage unavailable
- GIVEN localStorage throws on write
- THEN editing continues without a crash
