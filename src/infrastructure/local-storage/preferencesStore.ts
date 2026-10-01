import {
  DEFAULT_CURRENCY,
  type Currency,
  type Language,
  type Preferences,
  type PreferencesStore,
} from '@/application/preferences/ports';

export const PREFERENCES_KEY = 'vouquet:prefs:v1';

const isLanguage = (value: unknown): value is Language => value === 'es' || value === 'en';
const isCurrency = (value: unknown): value is Currency => value === 'COP' || value === 'USD';

/** Each field is validated on its own, so one bad value does not discard the other. */
function parsePreferences(stored: string | null): Preferences {
  let raw: unknown = null;
  try {
    raw = stored === null ? null : JSON.parse(stored);
  } catch {
    // Corrupt JSON behaves like no stored preferences.
  }
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    language: isLanguage(record.language) ? record.language : null,
    currency: isCurrency(record.currency) ? record.currency : DEFAULT_CURRENCY,
  };
}

/** `storage` is null when access is denied; every storage error is swallowed. */
export function createPreferencesStore(storage: Storage | null): PreferencesStore {
  return {
    load() {
      try {
        return parsePreferences(storage?.getItem(PREFERENCES_KEY) ?? null);
      } catch {
        return parsePreferences(null);
      }
    },
    save(preferences) {
      try {
        storage?.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      } catch {
        // Quota or blocked access: the choice just is not remembered.
      }
    },
  };
}
