import type { Point } from './point';

export type DockSide = 'top' | 'bottom';

/** Y of the model-space midpoint (y runs from -1000 to 300); anchors below it are in the lower half. */
const LOWER_HALF_Y = -350;

/** The toolbar docks to the top when the anchor is in the lower half, so it never covers the element. */
export const dockSide = (anchor: Point): DockSide => (anchor.y > LOWER_HALF_Y ? 'top' : 'bottom');
