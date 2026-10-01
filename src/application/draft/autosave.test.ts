import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { emptyBouquet, type Bouquet } from '@/domain/bouquet';
import { createDraftAutosave, AUTOSAVE_DELAY_MS } from './autosave';
import type { DraftStore } from './ports';

const bouquetWith = (wrappingId: Bouquet['wrappingId']): Bouquet => ({
  ...emptyBouquet(),
  wrappingId,
});

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('draft autosave', () => {
  let save: Mock<DraftStore['save']>;
  let store: DraftStore;
  let autosave: ReturnType<typeof createDraftAutosave>;

  beforeEach(() => {
    vi.useFakeTimers();
    save = vi.fn();
    store = { load: vi.fn(), save, clear: vi.fn() };
    autosave = createDraftAutosave(store);
  });

  afterEach(() => {
    autosave.dispose();
    setVisibility('visible');
    vi.useRealTimers();
  });

  it('saves once, 400 ms after the last change', () => {
    autosave.schedule(bouquetWith('kraft'));
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
    autosave.schedule(bouquetWith('ivory'));
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(bouquetWith('ivory'));
  });

  it('flush saves the pending bouquet immediately and only once', () => {
    autosave.schedule(bouquetWith('kraft'));
    autosave.flush();
    expect(save).toHaveBeenCalledWith(bouquetWith('kraft'));
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);
    autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flushes when the page becomes hidden, not when it becomes visible', () => {
    autosave.schedule(bouquetWith('kraft'));
    setVisibility('visible');
    expect(save).not.toHaveBeenCalled();
    setVisibility('hidden');
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flushes on pagehide', () => {
    autosave.schedule(bouquetWith('kraft'));
    window.dispatchEvent(new Event('pagehide'));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('dispose drops the pending save and stops listening', () => {
    autosave.schedule(bouquetWith('kraft'));
    autosave.dispose();
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    window.dispatchEvent(new Event('pagehide'));
    expect(save).not.toHaveBeenCalled();
  });
});
