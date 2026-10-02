import { readFileSync } from 'node:fs';
import gitignore from '../../.gitignore?raw';

const envExample = readFileSync('.env.local.example', 'utf8');

// Public environment variables the app may read from `import.meta.env`. Empty in the MVP:
// anything `VITE_`-prefixed is inlined into the browser bundle, so nothing secret may use it.
const PUBLIC_ENV_ALLOWLIST: readonly string[] = [];

const sources = import.meta.glob<string>('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const trackedText = import.meta.glob<string>(
  ['/src/**/*.{ts,tsx}', '/docs/**/*.md', '/.github/**/*', '/*.{md,json,jsonc,ts,js,html}'],
  { query: '?raw', import: 'default', eager: true },
);

const assignments = envExample
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '' && !line.startsWith('#'));

describe('.env.local.example', () => {
  it('lists the two Cloudflare keys and nothing else', () => {
    expect(assignments.map((line) => line.split('=')[0])).toEqual([
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
    ]);
  });

  it('holds only KEY= lines with empty values', () => {
    for (const line of assignments) {
      expect(line).toMatch(/^[A-Z][A-Z0-9_]*=$/);
    }
  });

  it('has no key with the browser-exposed VITE_ prefix', () => {
    expect(assignments.filter((line) => line.startsWith('VITE_'))).toEqual([]);
  });
});

describe('public repository hygiene', () => {
  it('ignores .env.local', () => {
    const patterns = gitignore.split('\n').map((line) => line.trim());
    expect(patterns).toEqual(expect.arrayContaining(['.env.*']));
    expect(patterns).toContain('!.env.local.example');
  });

  it('reads no VITE_ variable outside the explicit allowlist', () => {
    const reads = Object.entries(sources).flatMap(([path, text]) =>
      path.endsWith('repo-hygiene.test.ts')
        ? []
        : [...text.matchAll(/import\.meta\.env\.(VITE_\w+)/g)].map((m) => m[1] ?? ''),
    );
    expect(reads.filter((name) => !PUBLIC_ENV_ALLOWLIST.includes(name))).toEqual([]);
  });

  it.each([
    ['API token', /CLOUDFLARE_API_TOKEN\s*[=:]\s*["']?[A-Za-z0-9_-]{30,}/],
    ['account id', /CLOUDFLARE_ACCOUNT_ID\s*[=:]\s*["']?[0-9a-f]{32}\b/],
  ])('has no Cloudflare %s value in a tracked file', (_label, pattern) => {
    const offenders = Object.entries(trackedText)
      .filter(([, text]) => pattern.test(text))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
