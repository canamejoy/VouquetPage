import { use } from 'react';
import { I18nContext } from './I18nContext';
import type { Translate } from './translate';

export function useT(): Translate {
  return use(I18nContext);
}
