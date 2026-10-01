import type { Bouquet } from '@/domain/bouquet';
import type { DraftStore } from './ports';

export const AUTOSAVE_DELAY_MS = 400;

export interface DraftAutosave {
  /** Queues the bouquet; the latest one wins and is saved after the debounce delay. */
  schedule(bouquet: Bouquet): void;
  /** Saves the queued bouquet now, if any. */
  flush(): void;
  /** Drops the queued bouquet and stops listening for page lifecycle events. */
  dispose(): void;
}

/**
 * Debounced draft saving (design D8). The page can be closed inside the debounce window, so the
 * queued bouquet is also flushed when the page is hidden or being unloaded (`pagehide` covers the
 * browsers that skip `visibilitychange` on unload).
 */
export function createDraftAutosave(store: DraftStore): DraftAutosave {
  let pending: Bouquet | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancelTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const flush = () => {
    cancelTimer();
    if (pending === null) return;
    const bouquet = pending;
    pending = null;
    store.save(bouquet);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', flush);

  return {
    schedule(bouquet) {
      pending = bouquet;
      cancelTimer();
      timer = setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    flush,
    dispose() {
      cancelTimer();
      pending = null;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flush);
    },
  };
}
