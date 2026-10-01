import { BASE, DEEP, LIGHT, SHADE } from './paint';
import { petalRing, scallop } from './paths';

/** Rose seen from above: five stacked rings of overlapping petals closing into a tight bud. */
export function Rose() {
  return (
    <g aria-hidden="true">
      <path d={scallop(5, 66, 8)} {...SHADE} />
      <path d={scallop(5, 62, 8)} {...BASE} />
      <path d={scallop(5, 53, 7, 36)} {...SHADE} />
      <path d={scallop(5, 46, 7, 36)} {...BASE} />
      <path d={petalRing(5, 30, 54, 14, 36)} {...LIGHT} />
      <path d={scallop(4, 39, 6, 10)} {...SHADE} />
      <path d={scallop(4, 32, 6, 10)} {...BASE} />
      <path d={scallop(3, 27, 5, 60)} {...SHADE} />
      <path d={scallop(3, 20, 5, 60)} {...BASE} />
      <path d="M-11 3 Q-2 -9 11 -3 Q1 -3 -11 3 Z" {...SHADE} />
      <circle cx="2" cy="3" r="4" {...DEEP} />
      <ellipse cx="-5" cy="-10" rx="8" ry="3.5" {...LIGHT} />
    </g>
  );
}
