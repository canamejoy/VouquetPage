import { BACK, FRONT, TIE } from './shapes';

/** Ivory: smooth off-white paper with a soft sheen; cool shadows keep it visible on a light canvas. */
export function IvoryBack() {
  return (
    <g aria-hidden="true">
      <path d={BACK.sheet} fill="#E3DACA" />
      <path d={BACK.lit} fill="#F2ECDF" />
      <path d={BACK.shade} fill="#CFC4B0" />
      <path d={BACK.lining} fill="#FBF8F1" />
    </g>
  );
}

export function IvoryFront() {
  return (
    <g aria-hidden="true">
      <path d={FRONT.left} fill="#EDE5D6" />
      <path d={FRONT.right} fill="#F7F2E8" />
      <path d={FRONT.fold} fill="#FFFDF8" />
      <path d={FRONT.crease} fill="#C9BDA7" />
      <path d={TIE.band} fill="#B9A98A" />
      <path d={TIE.loopLeft} fill="#C9B994" />
      <path d={TIE.loopRight} fill="#C9B994" />
      <path d={TIE.tails} fill="#B9A98A" />
      <ellipse {...TIE.knot} fill="#A8956F" />
    </g>
  );
}
