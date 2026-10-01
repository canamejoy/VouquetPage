import { blobs } from './paths';

const ROWS = Array.from({ length: 10 }, (_, i) => -98 + i * 14);
/** Florets pair up along the spike and spread slightly towards its base. */
const side = (sign: 1 | -1, dx: number, dy: number) =>
  ROWS.map((y, i) => [sign * (6 + i * 1.2) + dx, y + dy] as const);

/** Lavender: fixed colours. A slim stem carrying a tapered spike of paired florets. */
export function Lavender() {
  return (
    <g aria-hidden="true">
      <path d="M-2 108 L-1.5 -90 L1.5 -90 L2 108 Z" fill="#6E8B5A" />
      <path d="M0 96 C-12 84 -20 64 -22 44 C-12 58 -4 74 0 84 Z" fill="#7D9A68" />
      <path d="M0 90 C12 78 20 60 22 42 C12 56 4 70 0 80 Z" fill="#5E7A4C" />
      <path d={blobs([...side(-1, -1, 3), ...side(1, 1, 3)], 7, 8.5)} fill="#6F4DA3" />
      <path d={blobs([...side(-1, 0, 0), ...side(1, 0, 0)], 6.5, 8)} fill="#8E6BBF" />
      <path d={blobs([...side(-1, 2, -3), ...side(1, -2, -3)], 3.5, 4.5)} fill="#B79AE0" />
      <ellipse cx="0" cy="-102" rx="5" ry="8" fill="#8E6BBF" />
    </g>
  );
}
