import type { BouquetElement } from './types';

const ID_PATTERN = /^e([1-9]\d*)$/;

/** Bouquet-local id `e{n}` with n one above the highest existing suffix (design D2). */
export function nextElementId(elements: readonly BouquetElement[]): string {
  const highest = elements.reduce((max, element) => {
    const match = ID_PATTERN.exec(element.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `e${highest + 1}`;
}
