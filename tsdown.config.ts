import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/vitest-when.ts',
  failOnWarn: 'ci-only',
  publint: true,
  attw: {
    profile: 'esm-only',
  },
})
