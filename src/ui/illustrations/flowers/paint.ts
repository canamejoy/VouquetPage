/**
 * Paint for recolourable flowers: the base colour comes from `currentColor` (the canvas sets
 * `color` on the wrapper) and depth comes from fixed translucent black and white overlays,
 * so one hex drives the whole flower and white still keeps its petal structure.
 */
export const BASE = { fill: 'currentColor' } as const;
export const SHADE = { fill: '#000', fillOpacity: 0.3 } as const;
export const DEEP = { fill: '#000', fillOpacity: 0.6 } as const;
export const LIGHT = { fill: '#fff', fillOpacity: 0.35 } as const;
