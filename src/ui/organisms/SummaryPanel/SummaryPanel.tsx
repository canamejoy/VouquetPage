import type { CatalogId, ColorId } from '@/domain/catalog';
import { useT } from '@/ui/i18n/useT';
import styles from './SummaryPanel.module.css';

export interface SummaryPanelLine {
  catalogId: CatalogId;
  colorId: ColorId | null;
  quantity: number;
  /** Already formatted in the active currency and language by the container. */
  amount: string;
}

export interface SummaryPanelGroup {
  kind: 'flowers' | 'foliage' | 'wrapping';
  lines: SummaryPanelLine[];
}

interface SummaryPanelProps {
  /** Empty groups are omitted by the caller; no groups means an empty bouquet. */
  groups: readonly SummaryPanelGroup[];
  total: string;
}

export function SummaryPanel({ groups, total }: SummaryPanelProps) {
  const t = useT();
  return (
    <section className={styles.panel} aria-labelledby="summary-title">
      <h2 id="summary-title" className={styles.title}>
        {t('summary.title')}
      </h2>
      {groups.length === 0 && <p className={styles.empty}>{t('summary.empty')}</p>}
      {groups.map((group) => (
        <div key={group.kind} className={styles.group}>
          <h3 className={styles.groupTitle}>{t(`summary.group.${group.kind}`)}</h3>
          <ul className={styles.lines}>
            {group.lines.map((line) => (
              <li key={`${line.catalogId}:${line.colorId ?? ''}`} className={styles.line}>
                <span className={styles.name}>
                  {line.colorId === null
                    ? t(`catalog.${line.catalogId}`)
                    : `${t(`catalog.${line.catalogId}`)}, ${t(`color.${line.colorId}`)}`}
                </span>
                <span className={styles.quantity}>
                  {t('summary.quantity', { count: line.quantity })}
                </span>
                <span className={styles.amount}>{line.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className={styles.total}>
        <span>{t('summary.estimatedTotal')}</span>
        <strong>{total}</strong>
      </div>
      <p className={styles.notice}>{t('summary.samplePricesNotice')}</p>
    </section>
  );
}
