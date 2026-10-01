import { CATALOG, COLOR_HEX } from '@/domain/catalog';
import type { FlowerId, FoliageId } from '@/domain/catalog';
import { flowerIllustrations } from '@/ui/illustrations/flowers';
import { foliageIllustrations } from '@/ui/illustrations/foliage';
import styles from './DragGhost.module.css';

const illustrations = { ...flowerIllustrations, ...foliageIllustrations };
const items = [...CATALOG.flowers, ...CATALOG.foliage];

export interface DragGhostProps {
  catalogId: FlowerId | FoliageId;
  /** Pointer position in client pixels. */
  x: number;
  y: number;
}

/** Decorative preview of the item being dragged; it never takes pointer events. */
export function DragGhost({ catalogId, x, y }: DragGhostProps) {
  const item = items.find((candidate) => candidate.id === catalogId);
  if (!item) return null;
  const Illustration = illustrations[catalogId];
  const [first] = item.kind === 'flower' ? item.colors : [];
  return (
    <svg
      data-testid="drag-ghost"
      aria-hidden="true"
      className={styles.ghost}
      viewBox={`${-item.size.width / 2} ${-item.size.height / 2} ${item.size.width} ${item.size.height}`}
      style={{ left: x, top: y, color: first ? COLOR_HEX[first] : undefined }}
    >
      <Illustration />
    </svg>
  );
}
