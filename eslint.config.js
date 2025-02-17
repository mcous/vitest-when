import baseConfig from '@mcous/eslint-config'

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['coverage', 'dist'],
  },
]
