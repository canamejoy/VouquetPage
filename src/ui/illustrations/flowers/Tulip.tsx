import { BASE, DEEP, LIGHT, SHADE } from './paint';

const LEFT = 'M2 68 C-34 70 -54 30 -50 -10 C-48 -36 -38 -58 -30 -72 C-20 -50 -8 -34 4 -18 Z';
const RIGHT = 'M-2 68 C34 70 54 30 50 -10 C48 -36 38 -58 30 -72 C20 -50 8 -34 -4 -18 Z';
const FRONT =
  'M0 72 C-30 64 -40 20 -30 -20 C-24 -46 -10 -62 0 -74 C10 -62 24 -46 30 -20 C40 20 30 64 0 72 Z';

/** Tulip in front view: a cup of three petals, the centre one overlapping the two behind it. */
export function Tulip() {
  return (
    <g aria-hidden="true">
      <path d={LEFT} {...BASE} />
      <path d={LEFT} {...SHADE} />
      <path d={RIGHT} {...BASE} />
      <path d={RIGHT} {...SHADE} />
      <path
        d="M0 74 C-34 66 -44 20 -33 -20 C-26 -48 -12 -64 0 -75 C12 -64 26 -48 33 -20 C44 20 34 66 0 74 Z"
        {...SHADE}
      />
      <path d={FRONT} {...BASE} />
      <path
        d="M-6 64 C-26 58 -34 20 -26 -18 C-22 -40 -10 -58 -2 -68 C-8 -40 -14 -10 -8 20 C-6 40 -6 54 -6 64 Z"
        {...LIGHT}
      />
      <path d="M12 60 C28 40 30 10 24 -20 C30 10 28 40 8 64 Z" {...SHADE} />
      <ellipse cx="0" cy="66" rx="9" ry="5" {...DEEP} />
    </g>
  );
}
