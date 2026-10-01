import { pinnate, rib } from './paths';

const sprig = {
  x: 0,
  y: 125,
  angle: 0,
  length: 196,
  pairs: 8,
  alternate: true,
  tip: true,
  leafLength: (t: number) => 60 - 16 * t,
  leafWidth: (t: number) => 17 - 4 * t,
  spread: () => 35,
} as const;

/** Ruscus: glossy, pointed oval leaves alternating up a stem, in a deep green. */
export function Ruscus() {
  return (
    <g aria-hidden="true">
      <path d={rib(sprig.x, sprig.y, sprig.angle, sprig.length, 3)} fill="#3C5E3E" />
      <path d={pinnate(sprig)} fill="#2D5E3F" />
      <path d={pinnate({ ...sprig, shrink: 0.75 })} fill="#3F7A52" />
      <path d={pinnate({ ...sprig, shrink: 0.3 })} fill="#6AA37B" />
    </g>
  );
}
