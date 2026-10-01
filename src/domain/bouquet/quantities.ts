import type { CatalogId, ColorId } from '../catalog';
import type { Bouquet } from './types';

export interface ElementQuantity {
  catalogId: CatalogId;
  colorId: ColorId | null;
  quantity: number;
}

/**
 * Stems per catalog item and colour, in order of first appearance. Derived on demand from the
 * elements; each element is one stem and no quantity is ever stored (design D2).
 */
export function elementQuantities(bouquet: Bouquet): ElementQuantity[] {
  const lines: ElementQuantity[] = [];
  for (const element of bouquet.elements) {
    const colorId = element.kind === 'flower' ? element.colorId : null;
    const line = lines.find((l) => l.catalogId === element.catalogId && l.colorId === colorId);
    if (line) line.quantity += 1;
    else lines.push({ catalogId: element.catalogId, colorId, quantity: 1 });
  }
  return lines;
}
