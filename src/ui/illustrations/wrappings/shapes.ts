/**
 * Shared silhouette of every wrapping, in canvas coordinates (origin at the binding point,
 * y down). The back sheet rises behind the blooms; the front panels fold over the stems below
 * the binding point. Only absolute commands are used so the extent stays checkable.
 */
export const BACK = {
  sheet:
    'M -340 -490 Q -250 -565 -140 -525 Q -40 -490 10 -535 Q 70 -500 160 -535 Q 270 -565 340 -490 L 70 245 Q 0 275 -70 245 Z',
  lit: 'M -340 -490 Q -250 -565 -140 -525 Q -60 -495 -20 -520 L -20 252 L -70 245 Z',
  shade: 'M 340 -490 L 70 245 Q 30 260 -10 256 L 150 -505 Q 270 -565 340 -490 Z',
  lining:
    'M -340 -490 Q -250 -565 -140 -525 Q -40 -490 10 -535 Q 70 -500 160 -535 Q 270 -565 340 -490 Q 270 -520 160 -488 Q 70 -455 10 -488 Q -40 -445 -140 -478 Q -250 -515 -340 -490 Z',
} as const;

export const FRONT = {
  left: 'M -290 -300 Q -170 -345 0 -280 L 25 248 Q -5 272 -45 250 Z',
  right: 'M 290 -300 Q 150 -340 -40 -250 L -40 248 Q 10 275 45 250 Z',
  fold: 'M 290 -300 Q 150 -340 -40 -250 L 60 -60 Q 190 -150 290 -300 Z',
  crease: 'M -40 -250 L -40 248 L -22 252 L -18 -262 Z',
} as const;

/** Band around the bundle at the binding point, plus bow loops and tails. */
export const TIE = {
  band: 'M -152 -24 Q 0 -6 152 -24 L 148 20 Q 0 40 -148 20 Z',
  loopLeft: 'M 0 -2 Q -75 -60 -100 -14 Q -80 36 0 -2 Z',
  loopRight: 'M 0 -2 Q 75 -60 100 -14 Q 80 36 0 -2 Z',
  tails: 'M -12 14 L -52 96 L -24 88 L 0 36 Z M 12 14 L 54 100 L 26 90 L 0 36 Z',
  knot: { cx: 0, cy: -2, rx: 24, ry: 22 },
} as const;
