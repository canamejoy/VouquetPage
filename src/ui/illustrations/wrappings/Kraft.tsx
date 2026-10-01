import { BACK, FRONT, TIE } from './shapes';

/** Kraft: matte warm brown paper with visible folds and a plain jute-coloured tie. */
export function KraftBack() {
  return (
    <g aria-hidden="true">
      <path d={BACK.sheet} fill="#A97B4F" />
      <path d={BACK.lit} fill="#B98C5C" />
      <path d={BACK.shade} fill="#8E6540" />
      <path d={BACK.lining} fill="#C79A69" />
    </g>
  );
}

export function KraftFront() {
  return (
    <g aria-hidden="true">
      <path d={FRONT.left} fill="#B98B5A" />
      <path d={FRONT.right} fill="#C79A69" />
      <path d={FRONT.fold} fill="#D6AA78" />
      <path d={FRONT.crease} fill="#8E6540" />
      <path d={TIE.band} fill="#7A5A3A" />
      <path d={TIE.loopLeft} fill="#5F4529" />
      <path d={TIE.loopRight} fill="#5F4529" />
      <path d={TIE.tails} fill="#6E5132" />
      <ellipse {...TIE.knot} fill="#4A3520" />
    </g>
  );
}
