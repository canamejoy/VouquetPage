export type Language = 'es' | 'en';
export type Currency = 'COP' | 'USD';

export const DEFAULT_CURRENCY: Currency = 'COP';

/** `language` is null until the user chooses one; the caller then resolves it from the browser. */
export interface Preferences {
  language: Language | null;
  currency: Currency;
}

/** Storage boundary for the remembered preferences. No method throws; failures are absorbed. */
export interface PreferencesStore {
  /** Invalid or missing stored values fall back to `null` language and COP. */
  load(): Preferences;
  save(preferences: Preferences): void;
}
