import type { Point } from './point';

/** Client-pixel rectangle of the rendered SVG element. Measured by the caller, never read here. */
export interface Viewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

// SVG viewBox "-500 -1000 1000 1300" with preserveAspectRatio "xMidYMid meet".
const VIEW_BOX = { x: -500, y: -1000, width: 1000, height: 1300 } as const;

const pixelsPerModelUnit = (viewport: Viewport): number =>
  Math.min(viewport.width / VIEW_BOX.width, viewport.height / VIEW_BOX.height);

/** Model units covered by one client pixel. Used to size hit areas and handles in pixels. */
export function modelPerPixel(viewport: Viewport): number {
  return 1 / pixelsPerModelUnit(viewport);
}

/** Inverse of the viewBox transform. Points in the letterbox map outside the model bounds. */
export function clientToModel(client: Point, viewport: Viewport): Point {
  const scale = pixelsPerModelUnit(viewport);
  const offsetX = (viewport.width - VIEW_BOX.width * scale) / 2;
  const offsetY = (viewport.height - VIEW_BOX.height * scale) / 2;
  return {
    x: (client.x - viewport.left - offsetX) / scale + VIEW_BOX.x,
    y: (client.y - viewport.top - offsetY) / scale + VIEW_BOX.y,
  };
}
