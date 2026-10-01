import { resolveInitialLanguage } from './initialLanguage';

describe('resolveInitialLanguage', () => {
  it.each([
    ['stored English beats a Spanish browser', 'en', ['es-CO'], 'en'],
    ['stored Spanish beats an English browser', 'es', ['en-US'], 'es'],
    ['browser English without a stored choice', null, ['en-GB'], 'en'],
    ['browser Spanish without a stored choice', null, ['es-MX'], 'es'],
    ['first supported language wins', null, ['fr-FR', 'en-US', 'es-ES'], 'en'],
    ['unsupported browser language defaults to Spanish', null, ['fr-FR'], 'es'],
    ['no browser languages defaults to Spanish', null, [], 'es'],
    ['an invalid stored value is ignored', 'de', ['en-US'], 'en'],
    ['case-insensitive tags', null, ['EN-us'], 'en'],
  ])('%s', (_name, stored, browser, expected) => {
    expect(resolveInitialLanguage(stored, browser)).toBe(expected);
  });
});
