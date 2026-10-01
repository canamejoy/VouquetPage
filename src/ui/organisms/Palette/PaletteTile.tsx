import { useId, type PointerEvent, type ReactNode } from 'react';
import styles from './PaletteTile.module.css';

interface PaletteTileProps {
  label: string;
  thumbnail?: ReactNode;
  /** Hex colours of a recolourable flower, drawn as dots. */
  swatches?: readonly string[] | undefined;
  /** Spoken equivalent of the swatches. */
  description?: string | undefined;
  /** Set for a choice that can be current (wrapping tiles); omitted for tiles that only add. */
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Set for tiles that can be dragged out; they allow only vertical panning. */
  onPointerDown?: (event: PointerEvent) => void;
}

export function PaletteTile({
  label,
  thumbnail,
  swatches,
  description,
  pressed,
  disabled,
  onClick,
  onPointerDown,
}: PaletteTileProps) {
  const descriptionId = useId();
  return (
    <>
      <button
        type="button"
        className={onPointerDown ? `${styles.tile} ${styles.draggable}` : styles.tile}
        aria-pressed={pressed}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={onClick}
        onPointerDown={onPointerDown}
      >
        {thumbnail}
        <span className={styles.label}>{label}</span>
        {swatches && (
          <span className={styles.swatches} aria-hidden="true">
            {swatches.map((hex) => (
              <span key={hex} className={styles.swatch} style={{ background: hex }} />
            ))}
          </span>
        )}
      </button>
      {description && (
        <span id={descriptionId} className={styles.hidden}>
          {description}
        </span>
      )}
    </>
  );
}
