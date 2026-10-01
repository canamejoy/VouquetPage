import { useEffect, useRef, useState } from 'react';
import { Button } from '@/ui/atoms/Button';
import type { TranslationKey } from '@/ui/i18n/en';
import { useT } from '@/ui/i18n/useT';
import { InlineConfirm } from '@/ui/molecules/InlineConfirm';
import styles from './CompositionPicker.module.css';

interface CompositionPickerProps {
  ids: readonly string[];
  hasArrangement: boolean;
  onApply: (compositionId: string) => void;
}

export function CompositionPicker({ ids, hasArrangement, onApply }: CompositionPickerProps) {
  const t = useT();
  const [pendingId, setPendingId] = useState<string | null>(null);
  return (
    <div className={styles.compositions}>
      {!hasArrangement && <p className={styles.hint}>{t('palette.emptyHint')}</p>}
      <ul className={styles.list}>
        {ids.map((id) => (
          <CompositionCard
            key={id}
            id={id}
            confirming={pendingId === id}
            onApply={() => {
              if (hasArrangement) setPendingId(id);
              else onApply(id);
            }}
            onConfirm={() => {
              setPendingId(null);
              onApply(id);
            }}
            onCancel={() => setPendingId(null)}
          />
        ))}
      </ul>
    </div>
  );
}

interface CompositionCardProps {
  id: string;
  confirming: boolean;
  onApply: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function CompositionCard({ id, confirming, onApply, onConfirm, onCancel }: CompositionCardProps) {
  const t = useT();
  const applyRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  // The prompt replaces the Apply button, so focus returns to it afterwards unless the user has
  // already moved on (another prompt took focus).
  useEffect(() => {
    if (wasConfirming.current && !confirming && document.activeElement === document.body) {
      applyRef.current?.focus();
    }
    wasConfirming.current = confirming;
  }, [confirming]);

  const name = t(`composition.${id}.name` as TranslationKey);
  return (
    <li className={styles.card}>
      <div>
        <strong>{name}</strong>
        <p className={styles.description}>{t(`composition.${id}.description` as TranslationKey)}</p>
      </div>
      {confirming ? (
        <InlineConfirm
          message={t('composition.replaceConfirm')}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ) : (
        <Button ref={applyRef} onClick={onApply} aria-label={`${t('composition.apply')} ${name}`}>
          {t('composition.apply')}
        </Button>
      )}
    </li>
  );
}
