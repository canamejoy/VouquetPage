import type { Currency } from '@/application/preferences/ports';
import type { Language } from './translate';

export type { Currency };

const LOCALES: Record<Language, string> = { es: 'es-CO', en: 'en-US' };
const FRACTION_DIGITS: Record<Currency, number> = { COP: 0, USD: 2 };

/**
 * Formats the domain's integers: whole pesos for COP, cents for USD (design D6). The currency
 * code replaces the ambiguous `$`; digit grouping follows the language.
 */
export function formatMoney(amount: number, currency: Currency, language: Language): string {
  const digits = FRACTION_DIGITS[currency];
  return new Intl.NumberFormat(LOCALES[language], {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}
