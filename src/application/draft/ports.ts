import type { Bouquet } from '@/domain/bouquet';

/** Storage boundary for the single autosaved draft. No method throws; failures are absorbed. */
export interface DraftStore {
  /** The stored bouquet, or null when there is none or the stored data is invalid (and removed). */
  load(): Bouquet | null;
  save(bouquet: Bouquet): void;
  clear(): void;
}
