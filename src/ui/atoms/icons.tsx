import type { ReactNode } from 'react';

/** Hand-authored 24 px icons drawn with a 1.5 px stroke (design D9). Names match `toolbar.*` keys. */
const drawings = {
  rotateLeft: (
    <>
      <path d="M9 5 5 8.5 9 12" />
      <path d="M5 8.5h9a5 5 0 0 1 0 10h-4" />
    </>
  ),
  rotateRight: (
    <>
      <path d="m15 5 4 3.5-4 3.5" />
      <path d="M19 8.5h-9a5 5 0 0 0 0 10h4" />
    </>
  ),
  smaller: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12h7" />
    </>
  ),
  larger: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12h7M12 8.5v7" />
    </>
  ),
  sendBackward: (
    <>
      <rect x="4" y="4" width="10" height="10" rx="1.5" />
      <path d="M10 10h10v10H10z" />
    </>
  ),
  bringForward: (
    <>
      <path d="M4 4h10v10H4z" />
      <rect x="10" y="10" width="10" height="10" rx="1.5" />
    </>
  ),
  duplicate: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M15 9V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15H9" />
    </>
  ),
  delete: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7" />
      <path d="M6.5 7 7.5 20h9L17.5 7M10 11v6M14 11v6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof drawings;

export const iconNames = Object.keys(drawings) as IconName[];

/** Decorative: the control that holds the icon carries the accessible name. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[name]}
    </svg>
  );
}
