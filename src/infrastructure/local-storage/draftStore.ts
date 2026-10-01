import type { DraftStore } from '@/application/draft/ports';
import { parseBouquet } from '@/domain/bouquet';

export const DRAFT_KEY = 'vouquet:draft:v1';

/**
 * `storage` is null when the browser denies access to localStorage. Every operation swallows
 * storage errors (quota, private mode, blocked access): the editor then works without persistence.
 */
export function createDraftStore(storage: Storage | null): DraftStore {
  const attempt = <T>(operation: (target: Storage) => T, fallback: T): T => {
    if (!storage) return fallback;
    try {
      return operation(storage);
    } catch {
      return fallback;
    }
  };

  const clear = () => attempt((target) => target.removeItem(DRAFT_KEY), undefined);

  return {
    load() {
      const stored = attempt((target) => target.getItem(DRAFT_KEY), null);
      if (stored === null) return null;
      let bouquet = null;
      try {
        bouquet = parseBouquet(JSON.parse(stored));
      } catch {
        // Unparsable JSON is treated like any other invalid draft.
      }
      if (!bouquet) clear();
      return bouquet;
    },
    save: (bouquet) =>
      attempt((target) => target.setItem(DRAFT_KEY, JSON.stringify(bouquet)), undefined),
    clear,
  };
}
