import { en, type TranslationKey } from './en';
import { es } from './es';

export type Language = 'es' | 'en';
export type TranslateParams = Readonly<Record<string, string | number>>;
export type Translate = (key: TranslationKey, params?: TranslateParams) => string;

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { en, es };

/** Replaces each `{name}` with its parameter; a placeholder without a parameter is left as is. */
export function createTranslate(language: Language): Translate {
  const dictionary = DICTIONARIES[language];
  return (key, params) =>
    dictionary[key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      String(params?.[name] ?? placeholder),
    );
}
