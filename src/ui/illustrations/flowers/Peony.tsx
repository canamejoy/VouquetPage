import { BASE, DEEP, LIGHT, SHADE, SOFT } from './paint';
import { petalRing, ruffle } from './paths';

/**
 * Peony: a full bowl. Seven broad guard petals around a dense mass of ruffled inner petals
 * with uneven lobes, lighter towards the centre.
 */
export function Peony() {
  return (
    <g aria-hidden="true">
      <path d={petalRing(7, 10, 93, 38)} {...BASE} />
      <path d={petalRing(7, 10, 62, 30)} {...SHADE} />
      <path d={ruffle(11, 66, 14, 8)} {...SOFT} />
      <path d={ruffle(11, 62, 14, 8)} {...BASE} />
      <path d={ruffle(9, 50, 12, 20)} {...SOFT} />
      <path d={ruffle(9, 46, 12, 20)} {...BASE} />
      <path d={ruffle(8, 34, 10, 5)} {...SOFT} />
      <path d={ruffle(8, 30, 10, 5)} {...BASE} />
      <path d={ruffle(8, 40, 10, 5)} {...LIGHT} />
      <path d={ruffle(6, 18, 8, 15)} {...SHADE} />
      <path d={ruffle(6, 14, 7, 15)} {...BASE} />
      <circle cx="0" cy="0" r="4" {...DEEP} />
    </g>
  );
}
