/** Shared colour values (design D3), defined once. Display names live in the dictionary as `color.<id>`. */
export const COLOR_HEX = {
  red: '#B3262E',
  blush: '#E8B7B9',
  white: '#F7F2EA',
  peach: '#F2B58C',
  burgundy: '#6E1F2E',
  yellow: '#EDC84A',
  pink: '#DE7FA0',
  purple: '#7E5AA6',
  coral: '#EE7A62',
  orange: '#E88A2E',
} as const;

export type ColorId = keyof typeof COLOR_HEX;
