import type { ReorderDirection } from '@/domain/bouquet';
import { COLOR_HEX, type ColorId } from '@/domain/catalog';
import type { DockSide } from '@/domain/geometry';
import { IconButton } from '@/ui/atoms/IconButton';
import { useT } from '@/ui/i18n/useT';
import styles from './SelectionToolbar.module.css';

interface SelectionToolbarProps {
  side: DockSide;
  /** True while a canvas gesture runs: the toolbar ignores pointer events. */
  pointerLocked: boolean;
  /** The selected flower's available colours; empty for foliage and fixed-colour flowers. */
  colors: readonly ColorId[];
  colorId: ColorId | null;
  /** A true entry disables the matching button (scale limits, ends of the layer order, element cap). */
  limits: {
    smaller: boolean;
    larger: boolean;
    backward: boolean;
    forward: boolean;
    duplicate: boolean;
  };
  onRotate: (direction: -1 | 1) => void;
  onScale: (direction: -1 | 1) => void;
  onReorder: (direction: Extract<ReorderDirection, 'forward' | 'backward'>) => void;
  onRecolor: (colorId: ColorId) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** Two fixed rows of 44 px controls: transform and layer, then colours, duplicate and delete. */
export function SelectionToolbar({
  side,
  pointerLocked,
  colors,
  colorId,
  limits,
  onRotate,
  onScale,
  onReorder,
  onRecolor,
  onDuplicate,
  onDelete,
}: SelectionToolbarProps) {
  const t = useT();
  return (
    <div
      role="toolbar"
      aria-label={t('toolbar.label')}
      className={styles.toolbar}
      data-side={side}
      data-pointer-locked={pointerLocked}
    >
      <div className={styles.row}>
        <IconButton icon="rotateLeft" onClick={() => onRotate(-1)} />
        <IconButton icon="rotateRight" onClick={() => onRotate(1)} />
        <IconButton icon="smaller" disabled={limits.smaller} onClick={() => onScale(-1)} />
        <IconButton icon="larger" disabled={limits.larger} onClick={() => onScale(1)} />
        <IconButton
          icon="sendBackward"
          disabled={limits.backward}
          onClick={() => onReorder('backward')}
        />
        <IconButton
          icon="bringForward"
          disabled={limits.forward}
          onClick={() => onReorder('forward')}
        />
      </div>
      <div className={styles.row}>
        {colors.length > 0 && (
          <div role="group" aria-label={t('toolbar.colors')} className={styles.swatches}>
            {colors.map((id) => (
              <button
                key={id}
                type="button"
                className={styles.swatch}
                style={{ background: COLOR_HEX[id] }}
                aria-label={t(`color.${id}`)}
                aria-pressed={id === colorId}
                onClick={() => onRecolor(id)}
              />
            ))}
          </div>
        )}
        <IconButton icon="duplicate" disabled={limits.duplicate} onClick={onDuplicate} />
        <IconButton icon="delete" onClick={onDelete} />
      </div>
    </div>
  );
}
