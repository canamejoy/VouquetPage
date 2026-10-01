import { BASE, DEEP, LIGHT, SHADE } from './paint';
import { petalRing, scallop } from './paths';

/** Peony: five dense rings of ruffled, scalloped petals that get smaller towards the centre. */
export function Peony() {
  return (
    <g aria-hidden="true">
      <path d={scallop(8, 80, 12)} {...SHADE} />
      <path d={scallop(8, 76, 12)} {...BASE} />
      <path d={scallop(8, 66, 11, 22.5)} {...SHADE} />
      <path d={scallop(8, 59, 11, 22.5)} {...BASE} />
      <path d={petalRing(8, 36, 66, 11, 22.5)} {...LIGHT} />
      <path d={scallop(7, 50, 10)} {...SHADE} />
      <path d={scallop(7, 43, 10)} {...BASE} />
      <path d={scallop(6, 36, 8, 30)} {...SHADE} />
      <path d={scallop(6, 29, 8, 30)} {...BASE} />
      <path d={scallop(5, 22, 6)} {...SHADE} />
      <path d={scallop(5, 15, 6)} {...BASE} />
      <circle cx="0" cy="0" r="4" {...DEEP} />
    </g>
  );
}
