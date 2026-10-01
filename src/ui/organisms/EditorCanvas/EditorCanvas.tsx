import type { Bouquet, BouquetElement } from '@/domain/bouquet';
import { COLOR_HEX, getFlower, getFoliage, type Catalog } from '@/domain/catalog';
import { flowerIllustrations } from '@/ui/illustrations/flowers';
import { foliageIllustrations } from '@/ui/illustrations/foliage';
import { wrappingIllustrations } from '@/ui/illustrations/wrappings';
import { useT } from '@/ui/i18n/useT';
import type { KeyboardEvent, PointerEvent, Ref } from 'react';
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
  /** Move, up and cancel reach the svg because the gesture owner captures the pointer on it. */
  onPointerMove?: (event: PointerEvent<SVGElement>) => void;
  onPointerUp?: (event: PointerEvent<SVGElement>) => void;
  onPointerCancel?: (event: PointerEvent<SVGElement>) => void;
  /** Key presses bubble from the focused element to the svg. */
  onKeyDown?: (event: KeyboardEvent<SVGElement>) => void;
  /** Focusing an element with the keyboard selects it. */
  onElementFocus?: (id: string) => void;
  /** The container measures the rendered svg; React 19 takes `ref` as a plain prop. */
  ref?: Ref<SVGSVGElement>;
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
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  onElementFocus,
  ref,
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
      ref={ref}
      className={styles.canvas}
      viewBox="-500 -1000 1000 1300"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={t('canvas.label')}
      // Focusable by script only, so focus has somewhere sensible to go after a delete.
      tabIndex={-1}
      onKeyDown={onKeyDown}
      // Touch drags on the design area must reach Pointer Events, not scroll the page (D1).
      style={{ touchAction: 'none' }}
      // The viewBox is letterboxed, so presses outside the background rect land on the svg itself.
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onBackgroundPointerDown?.(event);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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
              data-element-id={element.id}
              aria-label={labelOf(element, index)}
              onFocus={() => onElementFocus?.(element.id)}
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
