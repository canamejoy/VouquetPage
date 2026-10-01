import { selectSummary } from '@/application/editor/selectors';
import type { EditorState } from '@/application/editor/state';
import { formatMoney } from '@/ui/i18n/formatMoney';
import { SummaryPanel } from '@/ui/organisms/SummaryPanel/SummaryPanel';
import { usePreferences } from './PreferencesProvider';

interface SummaryContainerProps {
  state: EditorState;
}

/** Derives the summary from the bouquet and hands the panel amounts already formatted. */
export function SummaryContainer({ state }: SummaryContainerProps) {
  const { language, currency } = usePreferences();
  const summary = selectSummary(state);
  const money = (cop: number, usdCents: number) =>
    formatMoney(currency === 'COP' ? cop : usdCents, currency, language);

  return (
    <SummaryPanel
      groups={summary.groups.map((group) => ({
        kind: group.kind,
        lines: group.lines.map((line) => ({
          catalogId: line.catalogId,
          colorId: line.colorId,
          quantity: line.quantity,
          amount: money(line.lineCop, line.lineUsdCents),
        })),
      }))}
      total={money(summary.totalCop, summary.totalUsdCents)}
    />
  );
}
