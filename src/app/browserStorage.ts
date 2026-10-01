/** Reading `window.localStorage` itself can throw (blocked site data), so access is guarded. */
export function readLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
