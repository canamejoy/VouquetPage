import type { Language } from './translate';

const isLanguage = (value: string | null | undefined): value is Language =>
  value === 'es' || value === 'en';

/**
 * Stored preference first, then the first browser language that is Spanish or English, else
 * Spanish (design D7). Reading `localStorage` and `navigator.languages` is the caller's job.
 */
export function resolveInitialLanguage(
  stored: string | null,
  browserLanguages: readonly string[],
): Language {
  if (isLanguage(stored)) return stored;
  for (const tag of browserLanguages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLanguage(primary)) return primary;
  }
  return 'es';
}
