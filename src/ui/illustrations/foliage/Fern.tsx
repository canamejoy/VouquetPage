import { pinnate, rib } from './paths';

const frond = {
  x: -6,
  y: 135,
  angle: 3,
  length: 250,
  pairs: 15,
  tip: true,
  leafLength: (t: number) => 78 - 60 * t,
  leafWidth: (t: number) => 7 - 3 * t,
  spread: (t: number) => 72 - 30 * t,
} as const;

/** Fern: a frond tapering to its tip, with many small leaflets on a central rib. */
export function Fern() {
  return (
    <g aria-hidden="true">
      <path d={rib(frond.x, frond.y, frond.angle, frond.length, 3)} fill="#2F6B3A" />
      <path d={pinnate(frond)} fill="#3F7F45" />
      <path d={pinnate({ ...frond, shrink: 0.8 })} fill="#5E9E52" />
      <path d={pinnate({ ...frond, shrink: 0.5 })} fill="#8CC174" />
    </g>
  );
}
