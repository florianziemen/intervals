// Flat config without plugins, so it runs via npx with nothing installed.
const browser = Object.fromEntries(
  [
    'window',
    'document',
    'navigator',
    'location',
    'performance',
    'console',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'self',
    'caches',
    'fetch',
    'Response',
    'URL',
  ].map((name) => [name, 'readonly']),
);

export default [
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browser },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-use-before-define': ['error', { functions: false }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'Use textContent or el() for user text.' },
      ],
      'no-restricted-globals': ['error', 'alert', 'confirm', 'prompt'],
    },
  },
];
