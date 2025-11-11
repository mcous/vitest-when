import baseConfig from '@mcous/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig(
  baseConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TODO: enable this rule when Node v18 is dropped
      'unicorn/no-array-reverse': 'off',
    },
  },
  {
    files: ['src/types.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['test/typing.test-d.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  globalIgnores(['**/coverage/**', '**/dist/**']),
)
