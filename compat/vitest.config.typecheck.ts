import { defineConfig } from 'vitest/config'

/**
 * Vitest config for a type compatibility cell.
 *
 * No alias and no tsconfig `paths`, so `vitest-when` self-resolves through the
 * package's exports map and the assertions run against the published
 * `dist/vitest-when.d.mts` rather than against source.
 */
export default defineConfig({
  test: {
    include: [],
    typecheck: {
      enabled: true,
      only: true,
      include: ['test/typing.test-d.ts'],
      // `vi.fn<typeof SimpleClass>()` in test/vitest-when.test.ts uses a
      // generic form that only exists in Vitest 4. Those are source errors,
      // not assertion failures, and they say nothing about the published type
      // surface this cell checks. `pnpm test` still catches them strictly.
      ignoreSourceErrors: true,
    },
  },
})
