import { pinnate, rib } from './paths';

const sprig = {
  x: 4,
  y: 118,
  angle: -3,
  length: 191,
  pairs: 6,
  tip: true,
  leafLength: (t: number) => 60 - 14 * t,
  leafWidth: (t: number) => 9 - 2 * t,
  spread: (t: number) => 48 - 10 * t,
} as const;

/** Olive: narrow lance-shaped grey-green leaves in pairs, their paler undersides showing at the edges. */
export function Olive() {
  return (
    <g aria-hidden="true">
      <path d={rib(sprig.x, sprig.y, sprig.angle, sprig.length, 2.5)} fill="#7A6A55" />
      <path d={pinnate(sprig)} fill="#B9C4AE" />
      <path d={pinnate({ ...sprig, shrink: 0.8 })} fill="#7E9070" />
      <path d={pinnate({ ...sprig, shrink: 0.45 })} fill="#94A584" />
    </g>
  );
}
