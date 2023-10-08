import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      exclude: ['example'],
      reporter: ['text', 'html', 'lcovonly'],
    },
  },
})
