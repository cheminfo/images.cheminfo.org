import { defineConfig, globalIgnores } from 'eslint/config';
import { globals } from 'eslint-config-zakodium';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores([
    'coverage',
    'dist',
    // Outside every tsconfig, so the type-aware rules cannot parse them.
    'e2e',
    'playwright.config.ts',
    'playwright-report',
    'test-results',
  ]),
  ts,
  unicorn,
  react,
  {
    files: ['scripts/**', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: { globals: { ...globals.nodeBuiltin } },
  },
  {
    // The image pipeline runs in a worker and under vitest: no React there.
    files: ['src/imaging/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', '@blueprintjs/*'],
              message: 'src/imaging is pure logic: no React.',
            },
          ],
        },
      ],
    },
  },
);
