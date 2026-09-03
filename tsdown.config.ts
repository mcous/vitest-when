import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/vitest-when.ts',
  format: 'esm',
  fixedExtension: true,
  sourcemap: true,
  dts: true,
  failOnWarn: 'ci-only',
  publint: {
    level: 'error',
  },
  attw: {
    profile: 'esm-only',
    level: 'error',
  },
})
