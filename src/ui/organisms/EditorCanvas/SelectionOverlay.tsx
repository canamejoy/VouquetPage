import type { PointerEvent } from 'react';
import type { BouquetElement } from '@/domain/bouquet';
import type { Size } from '@/domain/catalog';
import styles from './SelectionOverlay.module.css';

export type HandleKind = 'scale' | 'rotate';

interface SelectionOverlayProps {
  element: BouquetElement;
  /** Catalog size of the element before its own scale. */
  size: Size;
  modelPerPixel: number;
  onHandlePointerDown?: (kind: HandleKind, event: PointerEvent<SVGElement>) => void;
}

const MARK_PX = 12;
const HIT_PX = 44;
const ROTATE_OFFSET_PX = 36;

/** Frame, four corner scale handles and a rotate handle; handle sizes are fixed in screen pixels. */
export function SelectionOverlay({
  element,
  size,
  modelPerPixel,
  onHandlePointerDown,
}: SelectionOverlayProps) {
  const halfWidth = (size.width * element.scale) / 2;
  const halfHeight = (size.height * element.scale) / 2;
  const mark = MARK_PX * modelPerPixel;
  const hit = HIT_PX * modelPerPixel;
  const rotateY = -halfHeight - ROTATE_OFFSET_PX * modelPerPixel;

  const handle = (kind: HandleKind, x: number, y: number) => (
    <g
      key={`${kind}${x}${y}`}
      data-handle={kind}
      transform={`translate(${x} ${y})`}
      onPointerDown={(event) => onHandlePointerDown?.(kind, event)}
    >
      <rect className={styles.mark} x={-mark / 2} y={-mark / 2} width={mark} height={mark} />
      <rect className={styles.hit} x={-hit / 2} y={-hit / 2} width={hit} height={hit} />
    </g>
  );

  return (
    <g
      data-layer="overlay"
      aria-hidden="true"
      transform={`translate(${element.position.x} ${element.position.y}) rotate(${element.rotation})`}
    >
      <rect
        data-part="frame"
        className={styles.frame}
        style={{ pointerEvents: 'none' }}
        x={-halfWidth}
        y={-halfHeight}
        width={halfWidth * 2}
        height={halfHeight * 2}
      />
      <line className={styles.stalk} x1={0} y1={-halfHeight} x2={0} y2={rotateY} />
      {handle('rotate', 0, rotateY)}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => handle('scale', sx * halfWidth, sy * halfHeight)),
      )}
    </g>
  );
}
