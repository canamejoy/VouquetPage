import { describe, expect, it } from 'vitest';
import { createFakeStorage, createThrowingStorage } from './fakeStorage.testing';
import { createPreferencesStore, PREFERENCES_KEY } from './preferencesStore';

describe('preferences store', () => {
  it('defaults to no language choice and COP', () => {
    expect(createPreferencesStore(createFakeStorage()).load()).toEqual({
      language: null,
      currency: 'COP',
    });
  });

  it('remembers language and currency under one key', () => {
    const storage = createFakeStorage();
    createPreferencesStore(storage).save({ language: 'en', currency: 'USD' });
    expect([...storage.keys()]).toEqual([PREFERENCES_KEY]);
    expect(createPreferencesStore(storage).load()).toEqual({ language: 'en', currency: 'USD' });
  });

  it.each([
    ['corrupt JSON', '{nope'],
    ['not an object', '"en"'],
    ['unknown values', JSON.stringify({ language: 'fr', currency: 'EUR' })],
    ['wrong types', JSON.stringify({ language: 1, currency: null })],
  ])('ignores invalid stored data: %s', (_name, stored) => {
    const storage = createFakeStorage({ [PREFERENCES_KEY]: stored });
    expect(createPreferencesStore(storage).load()).toEqual({ language: null, currency: 'COP' });
  });

  it('keeps the valid field when the other one is invalid', () => {
    const storage = createFakeStorage({
      [PREFERENCES_KEY]: JSON.stringify({ language: 'es', currency: 'EUR' }),
    });
    expect(createPreferencesStore(storage).load()).toEqual({ language: 'es', currency: 'COP' });
  });

  it('never throws when storage throws or is unavailable', () => {
    for (const storage of [createThrowingStorage(), null]) {
      const store = createPreferencesStore(storage);
      expect(store.load()).toEqual({ language: null, currency: 'COP' });
      expect(() => store.save({ language: 'en', currency: 'USD' })).not.toThrow();
    }
  });
});
