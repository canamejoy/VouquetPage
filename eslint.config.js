import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Dependency rule (design D5): domain imports nothing; application imports domain;
// ui imports application and domain; infrastructure imports application and domain;
// app imports all. Built-in rules only, no plugin.
const forbid = (message, ...group) => ({ group, message });

const domainPatterns = [
  forbid(
    'domain is pure: it must not import other layers.',
    '@/application/**',
    '@/infrastructure/**',
    '@/ui/**',
    '@/app/**',
    '**/application/**',
    '**/infrastructure/**',
    '**/ui/**',
    '**/app/**',
  ),
];

const applicationPatterns = [
  forbid(
    'application may import domain only.',
    '@/infrastructure/**',
    '@/ui/**',
    '@/app/**',
    '**/infrastructure/**',
    '**/ui/**',
    '**/app/**',
  ),
];

const infrastructurePatterns = [
  forbid(
    'infrastructure must not import ui or app.',
    '@/ui/**',
    '@/app/**',
    '**/ui/**',
    '**/app/**',
  ),
];

const uiPatterns = [
  forbid(
    'ui must not import infrastructure or app.',
    '@/infrastructure/**',
    '@/app/**',
    '**/infrastructure/**',
    '**/app/**',
  ),
];

// Presentational tiers read props and the i18n Context only (design D5).
const presentationalPatterns = [
  ...uiPatterns,
  forbid(
    'presentational tiers must not import ui/containers.',
    '@/ui/containers/**',
    '**/containers/**',
  ),
  forbid(
    'presentational tiers must not import application context or provider modules.',
    '@/application/**/*Provider*',
    '@/application/**/*Context*',
    '@/application/**/use*',
    '**/application/**/*Provider*',
    '**/application/**/*Context*',
    '**/application/**/use*',
  ),
];

const restrictImports = (patterns, paths = []) => ({
  'no-restricted-imports': ['error', { paths, patterns }],
});

const reactPaths = [
  { name: 'react', message: 'domain must not depend on React.' },
  { name: 'react-dom', message: 'domain must not depend on React.' },
];

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
    rules: { ...restrictImports(domainPatterns, reactPaths), ...noMathRandom },
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
