import { BASE, DEEP, LIGHT, SHADE, SOFT } from './paint';
import { petalRing } from './paths';

/**
 * Rose seen from above: five large outer petals, a middle tier turned half a petal, a third
 * tier turned the other way and a tight spiral bud. Each petal is darker at its base and
 * lighter at its rounded edge, which is what makes the overlaps read.
 */
export function Rose() {
  return (
    <g aria-hidden="true">
      <path d={petalRing(5, 6, 72, 36)} {...BASE} />
      <path d={petalRing(5, 6, 46, 28)} {...SHADE} />
      <path d={petalRing(5, 8, 56, 29, 36)} {...SOFT} />
      <path d={petalRing(5, 8, 52, 27, 36)} {...BASE} />
      <path d={petalRing(5, 8, 34, 21, 36)} {...SOFT} />
      <path d={petalRing(4, 5, 40, 33, 12)} {...SOFT} />
      <path d={petalRing(4, 5, 36, 30, 12)} {...BASE} />
      <path d={petalRing(4, 5, 22, 22, 12)} {...SOFT} />
      <circle cx="0" cy="0" r="20" {...SOFT} />
      <path
        d="M-12 -3 C-10 -14 6 -16 12 -6 C4 -10 -6 -8 -8 0 C-6 8 4 10 9 4 C6 12 -8 12 -12 -3 Z"
        {...SHADE}
      />
      <path d="M-6 -2 C-4 -8 4 -8 6 -2 C2 -5 -2 -4 -6 -2 Z" {...DEEP} />
      <ellipse cx="-7" cy="-11" rx="8" ry="3.5" {...LIGHT} />
    </g>
  );
}
