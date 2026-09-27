const js = require('@eslint/js');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        window: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },
  {
    files: ['tests/**/*.spec.js'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Catches the classic mistakes: a committed .only, a raw waitForTimeout,
      // or an assertion that was never awaited.
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'playwright/expect-expect': 'error',
      'playwright/no-wait-for-timeout': 'error',
    },
  },
];
