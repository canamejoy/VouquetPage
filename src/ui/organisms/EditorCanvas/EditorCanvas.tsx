import type { Bouquet, BouquetElement } from '@/domain/bouquet';
import { COLOR_HEX, getFlower, getFoliage, type Catalog } from '@/domain/catalog';
import { flowerIllustrations } from '@/ui/illustrations/flowers';
import { foliageIllustrations } from '@/ui/illustrations/foliage';
import { wrappingIllustrations } from '@/ui/illustrations/wrappings';
import { useT } from '@/ui/i18n/useT';
import type { PointerEvent } from 'react';
import styles from './EditorCanvas.module.css';
import { SelectionOverlay, type HandleKind } from './SelectionOverlay';
import { stemPath } from './stems';

interface EditorCanvasProps {
  bouquet: Bouquet;
  catalog: Catalog;
  selectedId: string | null;
  /** Model units per client pixel; keeps handles a constant on-screen size. */
  modelPerPixel: number;
  onBackgroundPointerDown?: (event: PointerEvent<SVGElement>) => void;
  onElementPointerDown?: (id: string, event: PointerEvent<SVGElement>) => void;
  onHandlePointerDown?: (kind: HandleKind, event: PointerEvent<SVGElement>) => void;
}

const NO_POINTER = { pointerEvents: 'none' } as const;

/** Renders the bouquet scene from its props alone (design D1); it holds no editor state. */
export function EditorCanvas({
  bouquet,
  catalog,
  selectedId,
  modelPerPixel,
  onBackgroundPointerDown,
  onElementPointerDown,
  onHandlePointerDown,
}: EditorCanvasProps) {
  const t = useT();
  const selected = bouquet.elements.find((element) => element.id === selectedId);
  const selectedSize = selected
    ? (selected.kind === 'flower'
        ? getFlower(selected.catalogId, catalog)
        : getFoliage(selected.catalogId, catalog)
      )?.size
    : undefined;
  const wrapping = bouquet.wrappingId ? wrappingIllustrations[bouquet.wrappingId] : null;
  const count = bouquet.elements.length;

  const labelOf = (element: BouquetElement, index: number): string => {
    const item = t(`catalog.${element.catalogId}`);
    const layer = { position: index + 1, count };
    return element.kind === 'flower' && element.colorId
      ? t('canvas.elementLabel', { item, color: t(`color.${element.colorId}`), ...layer })
      : t('canvas.elementLabelFixedColor', { item, ...layer });
  };

  return (
    <svg
      className={styles.canvas}
      viewBox="-500 -1000 1000 1300"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={t('canvas.label')}
    >
      <rect
        data-layer="background"
        className={styles.background}
        x={-500}
        y={-1000}
        width={1000}
        height={1300}
        onPointerDown={onBackgroundPointerDown}
      />
      {wrapping && (
        <g data-layer="wrapping-back" aria-hidden="true" style={NO_POINTER}>
          <wrapping.Back />
        </g>
      )}
      <g data-layer="stems" aria-hidden="true" style={NO_POINTER}>
        {bouquet.elements.map((element) => (
          <path key={element.id} className={styles.stem} d={stemPath(element.position)} />
        ))}
      </g>
      {wrapping && (
        <g data-layer="wrapping-front" aria-hidden="true" style={NO_POINTER}>
          <wrapping.Front />
        </g>
      )}
      <g data-layer="elements">
        {bouquet.elements.map((element, index) => {
          const Illustration =
            element.kind === 'flower'
              ? flowerIllustrations[element.catalogId]
              : foliageIllustrations[element.catalogId];
          const { position, rotation, scale } = element;
          return (
            <g
              key={element.id}
              role="button"
              tabIndex={0}
              aria-label={labelOf(element, index)}
              onPointerDown={(event) => onElementPointerDown?.(element.id, event)}
              transform={`translate(${position.x} ${position.y}) rotate(${rotation}) scale(${scale})`}
              style={
                element.kind === 'flower' && element.colorId
                  ? { color: COLOR_HEX[element.colorId] }
                  : undefined
              }
            >
              <Illustration />
            </g>
          );
        })}
      </g>
      {selected && selectedSize && (
        <SelectionOverlay
          element={selected}
          size={selectedSize}
          modelPerPixel={modelPerPixel}
          {...(onHandlePointerDown && { onHandlePointerDown })}
        />
      )}
    </svg>
  );
}
