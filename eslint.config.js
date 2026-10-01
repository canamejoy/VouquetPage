import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Dependency rule (design D5): domain imports nothing; application imports domain;
// ui imports application and domain; infrastructure imports application and domain;
// app imports all. Built-in rules only, no plugin.
//
// Layer patterns are anchored to the project's own layers so that a nested folder that
// happens to share a layer name (for example `src/domain/ui/`) is not caught by accident:
//   - alias form:    `@/<layer>` and anything below it
//   - relative form: one or more leading `../` followed directly by `<layer>`
// A `./<layer>` import points at a folder inside the importing layer, never at another layer.
const layer = (name) => `^(@/|(\\.\\./)+)${name}(/|$)`;
const forbid = (message, ...regexes) => regexes.map((regex) => ({ regex, message }));

const domainPatterns = [
  ...forbid(
    'domain is pure: it must not import other layers.',
    layer('application'),
    layer('infrastructure'),
    layer('ui'),
    layer('app'),
  ),
  // Subpaths such as `react/jsx-runtime` and `react-dom/client` are React too.
  {
    group: ['react/**', 'react-dom/**'],
    message: 'domain must not depend on React.',
  },
];

const applicationPatterns = forbid(
  'application may import domain only.',
  layer('infrastructure'),
  layer('ui'),
  layer('app'),
);

const infrastructurePatterns = forbid(
  'infrastructure must not import ui or app.',
  layer('ui'),
  layer('app'),
);

const uiPatterns = forbid(
  'ui must not import infrastructure or app.',
  layer('infrastructure'),
  layer('app'),
);

// Presentational tiers read props and the i18n Context only (design D5).
const presentationalPatterns = [
  ...uiPatterns,
  ...forbid(
    'presentational tiers must not import ui/containers.',
    '^(@/ui/|(\\.\\./)+(ui/)?)containers(/|$)',
  ),
  ...forbid(
    'presentational tiers must not import application context or provider modules.',
    '^(@/|(\\.\\./)+)application/(.*/)?([^/]*(Provider|Context)[^/]*|use[^/]*)(/|$)',
  ),
];

const restrictImports = (patterns, paths = []) => ({
  'no-restricted-imports': ['error', { paths, patterns }],
});

const reactPaths = [
  { name: 'react', message: 'domain must not depend on React.' },
  { name: 'react-dom', message: 'domain must not depend on React.' },
];

// `no-restricted-imports` only sees static imports; a dynamic `import()` would bypass it.
const noDynamicImport = {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'ImportExpression',
      message: 'domain must not use dynamic import(): it would bypass the layer rules.',
    },
  ],
};

const noMathRandom = {
  'no-restricted-properties': [
    'error',
    {
      object: 'Math',
      property: 'random',
      message: 'Use the seeded PRNG so results stay deterministic.',
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.wrangler', '.atl', 'openspec'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: { ...restrictImports(domainPatterns, reactPaths), ...noDynamicImport, ...noMathRandom },
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: { ...restrictImports(applicationPatterns), ...noMathRandom },
  },
  {
    files: ['src/infrastructure/**/*.{ts,tsx}'],
    rules: restrictImports(infrastructurePatterns),
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: restrictImports(uiPatterns),
  },
  {
    files: [
      'src/ui/atoms/**/*.{ts,tsx}',
      'src/ui/molecules/**/*.{ts,tsx}',
      'src/ui/organisms/**/*.{ts,tsx}',
    ],
    rules: restrictImports(presentationalPatterns),
  },
);
