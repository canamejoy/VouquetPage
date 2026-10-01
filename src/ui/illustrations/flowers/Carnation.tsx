import { BASE, DEEP, LIGHT, SHADE, SOFT } from './paint';
import { fringedRing, petalRing } from './paths';

/**
 * Carnation: overlapping fan petals whose outer edges are fringed with uneven teeth, in three
 * tiers and a domed centre. Each tier is darker at its base and lighter at its fringe.
 */
export function Carnation() {
  return (
    <g aria-hidden="true">
      <path d={fringedRing(7, 4, 63, 30, 0, 3)} {...BASE} />
      <path d={petalRing(7, 4, 42, 20, 0, true)} {...SHADE} />
      <path d={petalRing(21, 30, 54, 5, 0, true)} {...SOFT} />
      <path d={fringedRing(6, 4, 55, 35, 20, 3)} {...SHADE} />
      <path d={fringedRing(6, 4, 50, 33, 20, 3)} {...BASE} />
      <path d={petalRing(6, 4, 32, 22, 20, true)} {...SHADE} />
      <path d={petalRing(18, 24, 42, 5, 0, true)} {...SOFT} />
      <path d={fringedRing(5, 3, 41, 42, 40, 3)} {...SHADE} />
      <path d={fringedRing(5, 3, 36, 38, 40, 3)} {...BASE} />
      <path d={petalRing(5, 3, 22, 24, 40, true)} {...SHADE} />
      <path d={fringedRing(5, 2, 22, 44, 10, 3)} {...BASE} />
      <path d={fringedRing(5, 6, 18, 28, 10, 3)} {...LIGHT} />
      <circle cx="0" cy="0" r="3.5" {...DEEP} />
    </g>
  );
}
