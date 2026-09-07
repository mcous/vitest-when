import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/vitest-when.ts',
  treeshake: { moduleSideEffects: false },
  failOnWarn: 'ci-only',
  publint: true,
  attw: {
    profile: 'esm-only',
  },
})
