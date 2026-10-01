import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLocalStorage } from './browserStorage';

afterEach(() => vi.restoreAllMocks());

describe('readLocalStorage', () => {
  it('returns the browser storage', () => {
    expect(readLocalStorage()).toBe(window.localStorage);
  });

  it('returns null when merely reading the property throws, as with blocked cookies', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(readLocalStorage()).toBeNull();
  });
});
