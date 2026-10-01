import { BASE, DEEP, LIGHT, SHADE } from './paint';
import { petalRing } from './paths';

/** Gerbera: two staggered rings of narrow ray petals around a dark floret disc. */
export function Gerbera() {
  return (
    <g aria-hidden="true">
      <path d={petalRing(16, 10, 79, 8.5)} {...SHADE} />
      <path d={petalRing(16, 10, 77, 7)} {...BASE} />
      <path d={petalRing(16, 10, 62, 8.5, 11.25)} {...SHADE} />
      <path d={petalRing(16, 10, 60, 7, 11.25)} {...BASE} />
      <path d={petalRing(16, 20, 56, 2.5, 11.25)} {...LIGHT} />
      <circle cx="0" cy="0" r="22" {...SHADE} />
      <circle cx="0" cy="0" r="19" {...DEEP} />
      <path d={petalRing(12, 5, 15, 13)} {...LIGHT} />
      <circle cx="-6" cy="-6" r="4" {...LIGHT} />
    </g>
  );
}
