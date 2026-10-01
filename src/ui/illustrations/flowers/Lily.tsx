import { BASE, DEEP, LIGHT, SHADE, SOFT } from './paint';
import { petalRing } from './paths';

/**
 * Lily: six pointed petals, three slightly behind the other three, each with a midrib, a
 * star-shaped throat and six stamens that end in dark anthers.
 */
export function Lily() {
  return (
    <g aria-hidden="true">
      <path d={petalRing(3, 3, 86, 46, 60, true)} {...BASE} />
      <path d={petalRing(3, 3, 86, 46, 60, true)} {...SOFT} />
      <path d={petalRing(3, 3, 88, 50, 0, true)} {...SOFT} />
      <path d={petalRing(3, 3, 86, 46, 0, true)} {...BASE} />
      <path d={petalRing(6, 3, 40, 40, 0, true)} {...SOFT} />
      <path d={petalRing(6, 8, 74, 3, 0, true)} {...LIGHT} />
      <path d={petalRing(6, 0, 22, 26, 0, true)} {...SHADE} />
      <path d={petalRing(6, 0, 12, 22, 0, true)} {...DEEP} />
      <path d={petalRing(6, 3, 44, 2.5, 30, true)} {...LIGHT} />
      <path d={petalRing(6, 38, 52, 9, 30)} {...DEEP} />
    </g>
  );
}
