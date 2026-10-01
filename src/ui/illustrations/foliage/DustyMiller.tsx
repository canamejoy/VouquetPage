import { pinnate, rib } from './paths';

/** Three felted blades fanning from one point; each is a rib with deep, pointed lobes. */
const blades = [
  { x: 0, y: 73, angle: 0, length: 122, pairs: 5 },
  { x: -3, y: 75, angle: -38, length: 82, pairs: 4 },
  { x: 3, y: 75, angle: 38, length: 82, pairs: 4 },
].map((blade) => ({
  ...blade,
  tip: true,
  leafLength: (t: number) => 44 - 12 * t,
  leafWidth: (t: number) => 15 - 3 * t,
  spread: () => 62,
}));

/** Dusty miller: deeply lobed, felted silver-white leaves. */
export function DustyMiller() {
  return (
    <g aria-hidden="true">
      <path d={blades.map((b) => rib(b.x, b.y, b.angle, b.length, 3)).join(' ')} fill="#94A89E" />
      <path d={blades.map((b) => pinnate(b)).join(' ')} fill="#A8B8AE" />
      <path d={blades.map((b) => pinnate({ ...b, shrink: 0.82 })).join(' ')} fill="#CCD7D0" />
      <path d={blades.map((b) => pinnate({ ...b, shrink: 0.5 })).join(' ')} fill="#EDF2EE" />
    </g>
  );
}
