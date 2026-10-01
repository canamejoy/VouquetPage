import { createContext, use, useState, type ReactNode } from 'react';
import {
  DEFAULT_CURRENCY,
  type Currency,
  type Language,
  type Preferences,
  type PreferencesStore,
} from '@/application/preferences/ports';
import { I18nProvider } from '@/ui/i18n/I18nContext';
import { resolveInitialLanguage } from '@/ui/i18n/initialLanguage';

interface PreferencesValue {
  /** The resolved language: the stored choice, else the browser rule (design D7). */
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

interface PreferencesProviderProps {
  /** Created in the composition root; `ui` never imports the storage adapter. */
  store: PreferencesStore;
  browserLanguages?: readonly string[];
  children: ReactNode;
}

/** The port promises not to throw and to validate, but a broken store must never break the app. */
function loadSafely(store: PreferencesStore): Preferences {
  try {
    const { language, currency } = store.load();
    return {
      language: language === 'es' || language === 'en' ? language : null,
      currency: currency === 'COP' || currency === 'USD' ? currency : DEFAULT_CURRENCY,
    };
  } catch {
    return { language: null, currency: DEFAULT_CURRENCY };
  }
}

/**
 * Language and currency live apart from the editor state (design D5). Also mounts the i18n
 * Context, which carries only `t`, so consumers that need the language itself read it here.
 */
export function PreferencesProvider({
  store,
  browserLanguages = navigator.languages,
  children,
}: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState(() => loadSafely(store));

  const update = (next: Preferences) => {
    setPreferences(next);
    try {
      store.save(next);
    } catch {
      // Unsaved preferences only cost the user a re-selection after a reload.
    }
  };

  const language = resolveInitialLanguage(preferences.language, browserLanguages);
  const value: PreferencesValue = {
    language,
    currency: preferences.currency,
    setLanguage: (choice) => update({ ...preferences, language: choice }),
    setCurrency: (choice) => update({ ...preferences, currency: choice }),
  };

  return (
    <PreferencesContext value={value}>
      <I18nProvider language={language}>{children}</I18nProvider>
    </PreferencesContext>
  );
}

export function usePreferences(): PreferencesValue {
  const value = use(PreferencesContext);
  if (!value) throw new Error('usePreferences needs a PreferencesProvider');
  return value;
}
