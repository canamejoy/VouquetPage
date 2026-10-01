# Bouquet Editor Specification

## Purpose

The interactive design surface: palette, design area, selection and editing, on desktop and touch.

## Requirements

### Requirement: Create and add items

The user MUST be able to start a new empty bouquet and add flowers, foliage and one wrapping from the palette by dragging onto the design area or by tap/click. Tap/click MUST place the item at a default location inside the design area.

#### Scenario: Drag to add
- GIVEN an empty design area
- WHEN a rose is dragged from the palette and dropped on it
- THEN a rose element exists at the drop position

#### Scenario: Tap to add
- GIVEN an empty design area
- WHEN a palette item is tapped or clicked
- THEN it is added inside the design area and selected

#### Scenario: Drop outside
- GIVEN a drag in progress
- WHEN released outside the design area
- THEN no element is added

The user MUST confirm before a non-empty bouquet is discarded; the confirmation MUST be inline (no modal dialog). Because undo is out of scope, cancelling MUST leave the bouquet unchanged. The wrapping is chosen from the palette and is not placed or selected on the design area.

#### Scenario: New bouquet
- GIVEN a non-empty bouquet
- WHEN the user creates a new bouquet and confirms
- THEN the design area is empty

#### Scenario: New bouquet cancelled
- GIVEN a non-empty bouquet
- WHEN the user creates a new bouquet and cancels
- THEN the bouquet is unchanged

### Requirement: Selection and transforms

The user MUST be able to select an element and move, rotate, scale, duplicate, delete it and change its layer, with mouse, touch and pen. Selection MUST be visibly indicated, and tapping empty space MUST deselect. Touch interaction on the design area MUST NOT scroll the page.

#### Scenario: Move by touch
- GIVEN a selected element
- WHEN it is dragged by touch
- THEN it follows the pointer and the page does not scroll

#### Scenario: Rotate and scale handles
- GIVEN a selected element
- WHEN the rotate or scale handle is dragged
- THEN rotation or scale changes within model bounds

#### Scenario: Deselect
- GIVEN a selected element
- WHEN empty space is tapped
- THEN nothing is selected and handles are hidden

#### Scenario: Delete
- GIVEN a selected element
- WHEN delete is triggered
- THEN the element is removed

### Requirement: Keyboard access

Delete, duplicate and layer changes SHOULD also be reachable via visible buttons that are keyboard operable.

#### Scenario: Button actions
- GIVEN a selected element
- WHEN the duplicate button is activated by keyboard
- THEN the element is duplicated

### Requirement: Recolor

For recolorable flowers the user MUST be able to pick an available color, which updates the element.

#### Scenario: Recolor rose
- GIVEN a selected rose
- WHEN another available color is chosen
- THEN the rose renders in that color

### Requirement: Responsive tool layout

The layout MUST adapt from phone to desktop to resemble a design tool (palette, design area, properties/summary) without horizontal page scroll, and all controls MUST remain reachable.

#### Scenario: Narrow viewport
- GIVEN a 360px wide viewport
- THEN palette, design area and summary are all reachable without horizontal scroll

#### Scenario: Wide viewport
- GIVEN a 1280px wide viewport
- THEN palette and design area are visible side by side

### Requirement: Free composition

The user MUST be able to build a bouquet without any composition; element anchors are unconstrained within the model bounds.

#### Scenario: Manual only
- GIVEN no composition applied
- WHEN elements are added and moved freely
- THEN the editor accepts them
