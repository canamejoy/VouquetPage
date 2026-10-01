import { useState, type ReactNode } from 'react';
import { Button } from '@/ui/atoms/Button';
import { useT } from '@/ui/i18n/useT';
import { InlineConfirm } from '@/ui/molecules/InlineConfirm';
import styles from './Header.module.css';

interface HeaderProps {
  /** False for an empty bouquet: there is nothing to discard, so "New bouquet" is unavailable. */
  canDiscard: boolean;
  onNewBouquet: () => void;
  /** The language and currency switches, supplied by the page (design D9). */
  children: ReactNode;
}

export function Header({ canDiscard, onNewBouquet, children }: HeaderProps) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  return (
    <header className={styles.header}>
      <h1 className={styles.name}>{t('app.name')}</h1>
      {confirming ? (
        <InlineConfirm
          message={t('header.newBouquetConfirm')}
          onConfirm={() => {
            setConfirming(false);
            onNewBouquet();
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : (
        <Button disabled={!canDiscard} onClick={() => setConfirming(true)}>
          {t('header.newBouquet')}
        </Button>
      )}
      <div className={styles.switches}>{children}</div>
    </header>
  );
}
