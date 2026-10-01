import { petalRing } from './paths';

/** Sunflower: fixed colours. Two rings of pointed rays around a large, textured seed disc. */
export function Sunflower() {
  return (
    <g aria-hidden="true">
      <path d={petalRing(18, 26, 99, 9, 0, true)} fill="#C98A1A" />
      <path d={petalRing(18, 26, 97, 7.5, 0, true)} fill="#E8B923" />
      <path d={petalRing(18, 24, 82, 9, 10, true)} fill="#C98A1A" />
      <path d={petalRing(18, 24, 80, 7.5, 10, true)} fill="#F2C94A" />
      <path d={petalRing(18, 30, 70, 2.5, 10, true)} fill="#F9E38A" />
      <circle cx="0" cy="0" r="40" fill="#5A3A1E" />
      <circle cx="0" cy="0" r="35" fill="#3B2314" />
      <path d={petalRing(24, 8, 31, 9)} fill="#6B4423" />
      <path d={petalRing(12, 4, 17, 14)} fill="#8A5A2B" />
      <ellipse cx="-12" cy="-14" rx="10" ry="5" fill="#5A3A1E" />
    </g>
  );
}
