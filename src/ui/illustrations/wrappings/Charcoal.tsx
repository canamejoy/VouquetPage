import { BACK, FRONT, TIE } from './shapes';

/** Charcoal: dark matte paper with a contrasting warm gold ribbon. */
export function CharcoalBack() {
  return (
    <g aria-hidden="true">
      <path d={BACK.sheet} fill="#34383F" />
      <path d={BACK.lit} fill="#454A52" />
      <path d={BACK.shade} fill="#25282D" />
      <path d={BACK.lining} fill="#5A5F68" />
    </g>
  );
}

export function CharcoalFront() {
  return (
    <g aria-hidden="true">
      <path d={FRONT.left} fill="#3C4047" />
      <path d={FRONT.right} fill="#4A4F57" />
      <path d={FRONT.fold} fill="#5A5F68" />
      <path d={FRONT.crease} fill="#212428" />
      <path d={TIE.band} fill="#C9A24D" />
      <path d={TIE.loopLeft} fill="#DDB760" />
      <path d={TIE.loopRight} fill="#DDB760" />
      <path d={TIE.tails} fill="#B58E3C" />
      <ellipse {...TIE.knot} fill="#A07C2F" />
    </g>
  );
}
