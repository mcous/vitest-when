import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'vitest-when': './src/vitest-when.ts',
    },
  },
  test: {
    coverage: {
      provider: 'istanbul',
      exclude: ['example', 'test'],
      reporter: ['text', 'html', 'lcovonly'],
    },
  },
})
