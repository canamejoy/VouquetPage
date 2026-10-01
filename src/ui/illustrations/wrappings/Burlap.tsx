import { BACK, FRONT, TIE } from './shapes';

/** Half-width of the front cone at height y (its edges run from (290, -300) to (45, 250)). */
const coneHalf = (y: number) => 290 - (245 * (y + 300)) / 550;

/** Weave: darker threads kept inside the front cone, one horizontal and one vertical set. */
function weave(step: number): string {
  const threads: string[] = [];
  for (let y = -260; y <= 220; y += step) {
    const h = coneHalf(y) - 12;
    threads.push(`M ${-h} ${y} L ${h} ${y}`);
  }
  for (let x = -step * 4; x <= step * 4; x += step) {
    const top = -300 + (550 * (290 - Math.abs(x) - 12 - 0)) / 245;
    threads.push(`M ${x} -260 L ${x} ${Math.min(top, 235).toFixed(0)}`);
  }
  return threads.join(' ');
}

const THREAD = { fill: 'none', stroke: '#7D6335', strokeOpacity: 0.35, strokeWidth: 3 } as const;

/** Burlap: coarse woven fabric with a visible weave and a twine tie. */
export function BurlapBack() {
  return (
    <g aria-hidden="true">
      <path d={BACK.sheet} fill="#B89A62" />
      <path d={BACK.lit} fill="#C7AB74" />
      <path d={BACK.shade} fill="#9C8050" />
      <path d={BACK.lining} fill="#D2B883" />
    </g>
  );
}

export function BurlapFront() {
  return (
    <g aria-hidden="true">
      <path d={FRONT.left} fill="#BFA169" />
      <path d={FRONT.right} fill="#CDB07A" />
      <path d={FRONT.fold} fill="#D9C08C" />
      <path d={FRONT.crease} fill="#8F7343" />
      <path d={weave(28)} {...THREAD} />
      <path d={TIE.band} fill="#6B5230" />
      <path d={TIE.loopLeft} fill="#5A4426" />
      <path d={TIE.loopRight} fill="#5A4426" />
      <path d={TIE.tails} fill="#6B5230" />
      <ellipse {...TIE.knot} fill="#46341C" />
    </g>
  );
}
