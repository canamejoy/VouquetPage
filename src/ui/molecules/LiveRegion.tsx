import styles from './LiveRegion.module.css';

/** Polite announcements for assistive technology; sighted users see nothing. */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={styles.region}>
      {message}
    </div>
  );
}
