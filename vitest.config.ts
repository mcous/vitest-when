import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'vitest-when': new URL('src/vitest-when.ts', import.meta.url).pathname,
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*'],
      reporter: ['text', 'html', 'lcovonly'],
    },
  },
})
