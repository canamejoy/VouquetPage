/** In-memory `Storage` for tests, so none of them touches the shared jsdom `localStorage`. */
export function createFakeStorage(initial: Record<string, string> = {}): Storage & {
  keys(): IterableIterator<string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
    keys: () => data.keys(),
  };
}

/** A `Storage` whose every operation throws, like quota exceeded or blocked access. */
export function createThrowingStorage(): Storage {
  const fail = (): never => {
    throw new DOMException('storage failure', 'QuotaExceededError');
  };
  return {
    get length() {
      return fail();
    },
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}
