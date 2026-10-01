# ADR 0005: Editor state and layers

Status: accepted (slice 10, editor reducer).

## Context

One screen edits one bouquet. The state logic must be testable without React, and the code needs
a dependency direction that keeps the model free of UI concerns.

## Decision

- `EditorState = { bouquet, selectedId }`. The restored draft is the initial state
  (`initialEditorState(bouquet?)`), so no load action exists.
- `editorReducer(state, action)` is a pure function in `src/application/editor`. It delegates every
  change to the domain operations and adds only selection rules: add selects the new top element,
  duplicate selects the copy, deleting the selected element deselects, applying a composition and
  clearing deselect, selecting an unknown id is ignored.
- A no-op returns the same state reference, detected with `===` on the domain result, so React skips
  the render. Confirmations (new bouquet, applying a composition to a non-empty bouquet) are UI state;
  the reducer only performs the confirmed action.
- Selectors derive data from the state: `selectSelectedElement`, `selectLayerPosition`,
  `selectCanAdd`, `selectSummary`.
- Layers: `domain` imports nothing; `application` imports `domain`; `ui` imports `application` and
  `domain`; `infrastructure` imports `application` and `domain`; `app` imports all. ESLint enforces
  it with `no-restricted-imports` per folder.
- Context and providers arrive with the UI slices; language and currency stay outside the editor state.

## Alternatives

- Zustand or Redux Toolkit: a dependency with no present need for one screen.
- Undo/redo history: out of scope for the MVP.

## Consequences

- The reducer is tested with plain functions and no renderer.
- Broad re-renders on every action are harmless at this size.
