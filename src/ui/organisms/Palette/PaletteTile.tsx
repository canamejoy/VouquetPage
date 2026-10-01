import type { ReactNode } from 'react';
import styles from './PaletteTile.module.css';

interface PaletteTileProps {
  label: string;
  thumbnail?: ReactNode;
  /** Set for a choice that can be current (wrapping tiles); omitted for tiles that only add. */
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function PaletteTile({ label, thumbnail, pressed, disabled, onClick }: PaletteTileProps) {
  return (
    <button
      type="button"
      className={styles.tile}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      {thumbnail}
      <span className={styles.label}>{label}</span>
    </button>
  );
}
