#!/usr/bin/env node
/**
 * Run the compatibility matrix locally, the same way CI does.
 *
 * Usage:
 *   node compat/run.js                  every cell
 *   node compat/run.js node24-vitest4   one cell by name
 *   node compat/run.js types            every cell whose name contains "types"
 *   node compat/run.js --no-build       skip the dist rebuild
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * @typedef {object} Cell
 * @property {string} name
 * @property {string} node
 * @property {string} vitest
 * @property {string} [npm]
 * @property {string} [typescript]
 * @property {string} [entry]
 * @property {boolean} [allowFailure]
 */

const root = fileURLToPath(new URL('..', import.meta.url))

const matrix = /** @type {{ runtime: Cell[]; typecheck: Cell[] }} */ (
  JSON.parse(readFileSync(new URL('matrix.json', import.meta.url), 'utf8'))
)

const args = process.argv.slice(2)
const build = !args.includes('--no-build')
const filters = args.filter((argument) => !argument.startsWith('-'))

const cells = [
  ...matrix.runtime.map((cell) => ({ ...cell, mode: 'runtime' })),
  ...matrix.typecheck.map((cell) => ({ ...cell, mode: 'typecheck' })),
].filter(
  (cell) => filters.length === 0 || filters.some((f) => cell.name.includes(f)),
)

if (cells.length === 0) {
  console.error(`no cells match ${filters.join(', ')}`)
  process.exit(1)
}

/**
 * @param {string} command
 * @param {string[]} commandArgs
 * @returns {boolean}
 */
const run = (command, commandArgs) =>
  spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit' }).status === 0

if (build && !run('pnpm', ['build'])) {
  console.error('build failed')
  process.exit(1)
}

const results = []

for (const cell of cells) {
  const tag = `vitest-when-compat:${cell.name}`
  console.log(`\n=== ${cell.name} ===`)

  const buildArgs = [
    'build',
    '--file',
    'compat/Dockerfile',
    '--tag',
    tag,
    '--build-arg',
    `MODE=${cell.mode}`,
    '--build-arg',
    `NODE_VERSION=${cell.node}`,
    '--build-arg',
    `VITEST_VERSION=${cell.vitest}`,
    '--build-arg',
    `NPM_VERSION=${cell.npm ?? '11'}`,
    ...(cell.typescript
      ? ['--build-arg', `TS_VERSION=${cell.typescript}`]
      : []),
    '.',
  ]

  let ok = run('docker', buildArgs)

  if (ok) {
    const entry =
      cell.entry === 'src'
        ? ['--env', 'VITEST_WHEN_ENTRY=/app/src/vitest-when.ts']
        : []
    ok = run('docker', ['run', '--rm', ...entry, tag])
  }

  results.push({ cell, ok })
}

console.log('\n=== summary ===')
let failed = 0

for (const { cell, ok } of results) {
  const allowed = ok ? '' : cell.allowFailure ? ' (allowed)' : ''
  if (!ok && !cell.allowFailure) failed += 1
  console.log(`${ok ? 'pass' : 'FAIL'}  ${cell.name}${allowed}`)
}

process.exit(failed > 0 ? 1 : 0)
