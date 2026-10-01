const FULL_TURN = 360;

/** Normalizes degrees to [0, 360). Never returns 360 or negative zero. */
export function normalizeAngle(degrees: number): number {
  const wrapped = ((degrees % FULL_TURN) + FULL_TURN) % FULL_TURN;
  return wrapped >= FULL_TURN || wrapped === 0 ? 0 : wrapped;
}
