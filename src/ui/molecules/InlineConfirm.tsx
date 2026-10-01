import { useId } from 'react';
import { Button } from '@/ui/atoms/Button';
import { useT } from '@/ui/i18n/useT';
import styles from './InlineConfirm.module.css';

interface InlineConfirmProps {
  /** The question, already localized by the caller. */
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Non-modal confirmation shown in place of the control that was pressed (design D9). Focus moves
 * to Confirm when it appears so keyboard users find it; it is never trapped.
 */
export function InlineConfirm({ message, onConfirm, onCancel }: InlineConfirmProps) {
  const t = useT();
  const messageId = useId();
  return (
    <div role="group" aria-labelledby={messageId} className={styles.confirm}>
      <p id={messageId} className={styles.message}>
        {message}
      </p>
      <div className={styles.actions}>
        <Button variant="primary" autoFocus onClick={onConfirm}>
          {t('common.confirm')}
        </Button>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
      </div>
    </div>
  );
}
