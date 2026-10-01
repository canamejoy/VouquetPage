import { BASE, DEEP, LIGHT, SHADE } from './paint';
import { petalRing, serrated } from './paths';

/** Carnation: four rings with a serrated, ruffled edge and fine folds towards the centre. */
export function Carnation() {
  return (
    <g aria-hidden="true">
      <path d={serrated(16, 62, 7)} {...SHADE} />
      <path d={serrated(16, 58, 7)} {...BASE} />
      <path d={serrated(14, 49, 6, 6)} {...SHADE} />
      <path d={serrated(14, 43, 6, 6)} {...BASE} />
      <path d={serrated(12, 36, 5)} {...SHADE} />
      <path d={serrated(12, 30, 5)} {...BASE} />
      <path d={serrated(10, 24, 4, 9)} {...SHADE} />
      <path d={serrated(10, 18, 4, 9)} {...BASE} />
      <path d={petalRing(10, 8, 42, 5, 0, true)} {...LIGHT} />
      <path d={petalRing(10, 3, 18, 9, 18, true)} {...SHADE} />
      <circle cx="0" cy="0" r="4" {...DEEP} />
    </g>
  );
}
