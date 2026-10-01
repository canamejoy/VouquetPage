import { createContext, useEffect, useMemo, type ReactNode } from 'react';
import { createTranslate, type Language, type Translate } from './translate';

/** The default is Spanish, so a presentational component renders without a provider (design D5). */
export const I18nContext = createContext<Translate>(createTranslate('es'));

interface I18nProviderProps {
  language: Language;
  children: ReactNode;
}

export function I18nProvider({ language, children }: I18nProviderProps) {
  const t = useMemo(() => createTranslate(language), [language]);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return <I18nContext value={t}>{children}</I18nContext>;
}
