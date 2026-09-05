import { defineConfig } from 'vitest/config'

/**
 * Vitest config for a runtime compatibility cell.
 *
 * With no alias, `vitest-when` self-resolves through the package's own exports
 * map to `dist/`, so the cell exercises the published entrypoint. Cells set
 * VITEST_WHEN_ENTRY to override that: Vitest 0.31 and 1 cannot instrument the
 * bundle for coverage under any provider, so they point at `src` instead, and
 * Vite 4 has no self-reference support so 0.31 requires the override anyway.
 */
const entry = process.env.VITEST_WHEN_ENTRY

export default defineConfig({
  resolve: entry ? { alias: { 'vitest-when': entry } } : {},
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcovonly'],
      // Replaces the provider defaults rather than extending them. Left alone,
      // Vitest 2 and 3 pull test files, this config, and the emitted .d.mts
      // into the report; Vitest 4 does not. Never use `include` here -- on
      // Vitest 4 it finds the files but reports every one of them as zero.
      exclude: [
        'example/**',
        'test/**',
        'vitest.config.ts',
        '**/*.d.mts',
        'src/types.ts',
      ],
    },
  },
})
