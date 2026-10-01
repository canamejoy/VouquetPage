import { BASE, DEEP, LIGHT, SHADE } from './paint';
import { petalRing } from './paths';

/** Lily: three outer and three inner pointed petals in a star, with a throat and stamens. */
export function Lily() {
  return (
    <g aria-hidden="true">
      <path d={petalRing(3, 4, 88, 40, 0, true)} {...BASE} />
      <path d={petalRing(3, 4, 88, 40, 0, true)} {...SHADE} />
      <path d={petalRing(3, 4, 83, 44, 60, true)} {...SHADE} />
      <path d={petalRing(3, 4, 80, 40, 60, true)} {...BASE} />
      <path d={petalRing(3, 6, 66, 3, 60, true)} {...LIGHT} />
      <path d={petalRing(6, 0, 24, 14, 0, true)} {...DEEP} />
      <path d={petalRing(6, 2, 40, 2, 30, true)} {...LIGHT} />
      <path d={petalRing(6, 36, 48, 9, 30)} {...DEEP} />
    </g>
  );
}
