import { useId, useState, type ReactNode } from 'react';
import { selectSummary } from '@/application/editor/selectors';
import type { EditorState } from '@/application/editor/state';
import { formatMoney } from '@/ui/i18n/formatMoney';
import { useT } from '@/ui/i18n/useT';
import styles from './AppShell.module.css';
import { usePreferences } from './PreferencesProvider';
import { SummaryContainer } from './SummaryContainer';

interface AppShellProps {
  state: EditorState;
  header: ReactNode;
  palette: ReactNode;
  /** The canvas and the selection toolbar; the toolbar docks inside this region. */
  canvas: ReactNode;
}

/**
 * The page layout (design D9): three panels from 1024 px, otherwise a column with the summary
 * disclosure on top and the palette sheet under the canvas. CSS picks the presentation.
 */
export function AppShell({ state, header, palette, canvas }: AppShellProps) {
  const t = useT();
  const { language, currency } = usePreferences();
  const summaryId = useId();
  const [expanded, setExpanded] = useState(false);
  const { totalCop, totalUsdCents } = selectSummary(state);
  const total = formatMoney(currency === 'COP' ? totalCop : totalUsdCents, currency, language);

  return (
    <div className={styles.shell}>
      {header}
      <section className={styles.palette} aria-label={t('palette.label')}>
        {palette}
      </section>
      <main className={styles.canvas} aria-label={t('canvas.label')}>
        {canvas}
        {state.bouquet.elements.length === 0 && (
          <p className={styles.hint}>{t('canvas.emptyHint')}</p>
        )}
      </main>
      <aside className={styles.summary} aria-label={t('summary.title')}>
        <button
          type="button"
          className={styles.chip}
          aria-expanded={expanded}
          aria-controls={summaryId}
          onClick={() => setExpanded((open) => !open)}
        >
          <span>{t('summary.title')}</span>
          <strong>{total}</strong>
        </button>
        <div id={summaryId} className={styles.body} data-expanded={expanded}>
          <SummaryContainer state={state} />
        </div>
      </aside>
    </div>
  );
}
