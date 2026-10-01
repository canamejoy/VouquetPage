import { pinnate, rib } from './paths';

const sprig = {
  x: -8,
  y: 118,
  angle: 4,
  length: 207,
  pairs: 6,
  rounded: true,
  tip: true,
  leafLength: (t: number) => 44 - 15 * t,
  leafWidth: (t: number) => 19 - 5 * t,
  spread: (t: number) => 66 - 6 * t,
} as const;

/** Eucalyptus: round, coin-like silvery-blue leaves paired along a slim stem. */
export function Eucalyptus() {
  return (
    <g aria-hidden="true">
      <path d={rib(sprig.x, sprig.y, sprig.angle, sprig.length, 3)} fill="#7B8F7F" />
      <path d={pinnate(sprig)} fill="#7FA3A0" />
      <path d={pinnate({ ...sprig, shrink: 0.7 })} fill="#A3C0BC" />
      <path d={pinnate({ ...sprig, shrink: 0.35 })} fill="#CADDD8" />
    </g>
  );
}
