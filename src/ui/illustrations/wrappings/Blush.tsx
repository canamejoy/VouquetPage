import { BACK, FRONT, TIE } from './shapes';

/** Blush: soft pink tissue; a lighter inner sheet shows along the rim and under the front fold. */
export function BlushBack() {
  return (
    <g aria-hidden="true">
      <path d={BACK.sheet} fill="#EBB4BD" />
      <path d={BACK.lit} fill="#F3C9D0" />
      <path d={BACK.shade} fill="#D99AA6" />
      <path d={BACK.lining} fill="#FBE6E9" />
    </g>
  );
}

export function BlushFront() {
  return (
    <g aria-hidden="true">
      <path d={FRONT.left} fill="#F0BDC6" />
      <path d={FRONT.right} fill="#F6CDD4" />
      <path d={FRONT.fold} fill="#FBE6E9" />
      <path d={FRONT.crease} fill="#D99AA6" />
      <path d={TIE.band} fill="#FFF7F2" />
      <path d={TIE.loopLeft} fill="#FFFFFF" />
      <path d={TIE.loopRight} fill="#FFFFFF" />
      <path d={TIE.tails} fill="#F5E9E4" />
      <ellipse {...TIE.knot} fill="#EBDCD6" />
    </g>
  );
}
