import { SegmentedSwitch } from '@/ui/atoms/SegmentedSwitch';
import { useT } from '@/ui/i18n/useT';
import { usePreferences } from './PreferencesProvider';

/** The language and currency switches; the header places them (design D9). */
export function PreferenceSwitches() {
  const t = useT();
  const { language, currency, setLanguage, setCurrency } = usePreferences();
  return (
    <>
      <SegmentedSwitch
        label={t('header.language')}
        options={[
          { value: 'es', label: t('language.es') },
          { value: 'en', label: t('language.en') },
        ]}
        value={language}
        onChange={setLanguage}
      />
      <SegmentedSwitch
        label={t('header.currency')}
        options={[
          { value: 'COP', label: t('currency.COP') },
          { value: 'USD', label: t('currency.USD') },
        ]}
        value={currency}
        onChange={setCurrency}
      />
    </>
  );
}
