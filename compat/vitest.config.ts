import { createRequire } from 'node:module'

import { defineConfig } from 'vitest/config'

const { version } = createRequire(import.meta.url)('vitest/package.json') as {
  version: string
}

const vitestMajorVersion = Number(version.split('.')[0])
const bundleEntry = new URL('dist/vitest-when.mjs', import.meta.url).pathname

const supportsSelfReference = vitestMajorVersion >= 1

export default defineConfig({
  resolve: supportsSelfReference
    ? {}
    : { alias: { 'vitest-when': bundleEntry } },
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcovonly'],
      // Collected on the bundle, remapped to sources -- an explicit `include` matches neither end and reports zeros.
      exclude: ['test/**', 'vitest.config.ts', '**/*.d.mts', 'src/types.ts'],
    },
  },
})
