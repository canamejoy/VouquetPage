import { describe, expect, it } from 'vitest';
import { emptyBouquet, type Bouquet } from '@/domain/bouquet';
import { createDraftStore, DRAFT_KEY } from './draftStore';
import { createFakeStorage, createThrowingStorage } from './fakeStorage.testing';

const rose = (id: string) =>
  ({
    kind: 'flower',
    id,
    catalogId: 'rose',
    colorId: 'red',
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: 1,
  }) as const;

const bouquetOf = (count: number): Bouquet => ({
  schemaVersion: 1,
  elements: Array.from({ length: count }, (_, index) => rose(`e${index + 1}`)),
  wrappingId: 'kraft',
});

describe('draft store', () => {
  it('restores what it saved', () => {
    const storage = createFakeStorage();
    const store = createDraftStore(storage);
    store.save(bouquetOf(3));
    expect(createDraftStore(storage).load()).toEqual(bouquetOf(3));
  });

  it('keeps a single draft under one key', () => {
    const storage = createFakeStorage();
    const store = createDraftStore(storage);
    store.save(bouquetOf(3));
    store.save(emptyBouquet());
    expect([...storage.keys()]).toEqual([DRAFT_KEY]);
    expect(store.load()).toEqual(emptyBouquet());
  });

  it('returns null when there is no draft', () => {
    expect(createDraftStore(createFakeStorage()).load()).toBeNull();
  });

  it.each([
    ['corrupt JSON', '{not json'],
    ['unknown version', JSON.stringify({ ...bouquetOf(1), schemaVersion: 2 })],
    ['over the element limit', JSON.stringify(bouquetOf(61))],
    ['wrong shape', '[1, 2]'],
  ])('discards %s and removes the key', (_name, stored) => {
    const storage = createFakeStorage({ [DRAFT_KEY]: stored });
    expect(createDraftStore(storage).load()).toBeNull();
    expect(storage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('clear removes the draft', () => {
    const storage = createFakeStorage();
    const store = createDraftStore(storage);
    store.save(bouquetOf(1));
    store.clear();
    expect(storage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('never throws when storage throws on read, write or remove', () => {
    const store = createDraftStore(createThrowingStorage());
    expect(store.load()).toBeNull();
    expect(() => store.save(bouquetOf(1))).not.toThrow();
    expect(() => store.clear()).not.toThrow();
  });

  it('never throws when the storage is unavailable', () => {
    const store = createDraftStore(null);
    expect(store.load()).toBeNull();
    expect(() => store.save(bouquetOf(1))).not.toThrow();
  });
});
