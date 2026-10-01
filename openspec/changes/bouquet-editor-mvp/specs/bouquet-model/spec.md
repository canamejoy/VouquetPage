# Bouquet Model Specification

## Purpose

A structured bouquet representation independent of any renderer. Summary and price derive from it only.

## Requirements

### Requirement: Renderer-independent structure

The model MUST describe a bouquet as an ordered list of elements (flower, foliage), each with catalog item, optional color, position, rotation and scale, plus at most one wrapping chosen by catalog item. A wrapping has no position, rotation, scale or layer and is not selectable on the design area. The model MUST NOT depend on any rendering technology or rendered output.

#### Scenario: Model is plain data
- GIVEN a bouquet with three elements
- WHEN it is serialized to JSON and parsed back
- THEN the parsed bouquet equals the original

#### Scenario: Second wrapping replaces the first
- GIVEN a bouquet with wrapping A
- WHEN wrapping B is chosen
- THEN the bouquet has exactly one wrapping, B

#### Scenario: Remove wrapping
- GIVEN a bouquet with wrapping A
- WHEN the wrapping is cleared
- THEN the bouquet has no wrapping and its elements are unchanged

### Requirement: Element operations

The model MUST support add, move, rotate, scale, duplicate, delete and recolor as pure operations producing a new bouquet value. Scale MUST be bounded to a documented min/max.

#### Scenario: Duplicate
- GIVEN a bouquet with one rose
- WHEN the rose is duplicated
- THEN the bouquet has two roses with distinct identities and the copy is above the original

#### Scenario: Scale clamped
- GIVEN an element
- WHEN scaled beyond the maximum
- THEN its scale equals the maximum

#### Scenario: Delete unknown element
- GIVEN a bouquet
- WHEN deleting an identity not in it
- THEN the bouquet is unchanged

### Requirement: Element limit

A bouquet MUST contain at most 60 flower and foliage elements in total. Add and duplicate MUST leave the bouquet unchanged when the limit is reached. Applying a composition MUST NOT produce more elements than it received.

#### Scenario: Add at limit
- GIVEN a bouquet with 60 elements
- WHEN another element is added
- THEN the bouquet is unchanged

#### Scenario: Duplicate at limit
- GIVEN a bouquet with 60 elements
- WHEN an element is duplicated
- THEN the bouquet is unchanged

#### Scenario: Draft above limit
- GIVEN a stored draft with 61 elements
- WHEN the app loads
- THEN the draft is discarded and the editor starts empty

### Requirement: Position bounds

Element positions MUST be clamped to the model bounds (x from -500 to 500, y from -1000 to 300 model units). Bounds apply to the element anchor.

#### Scenario: Move beyond bounds
- GIVEN a selected element
- WHEN it is moved outside the design area
- THEN its position equals the nearest point inside the bounds

### Requirement: Layer order

Position in the list MUST define depth. The model MUST support bring forward, send backward, to front and to back; at the ends these MUST be no-ops.

#### Scenario: Bring forward
- GIVEN elements A, B, C (C on top) 
- WHEN A is brought forward
- THEN the order is B, A, C

#### Scenario: Already on top
- GIVEN C on top
- WHEN C is brought to front
- THEN the order is unchanged

### Requirement: Derived quantities

Per-item quantities MUST be computed from the elements and MUST NOT be stored separately.

#### Scenario: Quantity follows edits
- GIVEN a bouquet with two roses
- WHEN one is deleted
- THEN the derived rose quantity is 1
