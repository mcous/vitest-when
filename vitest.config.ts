import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'vitest-when': new URL('src/vitest-when.ts', import.meta.url).pathname,
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
