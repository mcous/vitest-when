/**
 * Derive a per-cell package.json from the project's own.
 *
 * Everything that makes this a package -- name, type, exports, dependencies,
 * engines -- is kept verbatim, because that is what a cell exists to validate.
 * devDependencies are replaced wholesale with the test toolchain pinned at the
 * cell's Vitest version, so bumping build tooling in the repo (tsdown, eslint,
 * typescript, each with its own moving Node floor) can never break a cell
 * running on older Node.
 *
 * @vitest/expect is deliberately absent. It is an optional peer that must bind
 * to the exact copy vitest resolved; installing it independently lets npm pick
 * a different patch, yielding two copies and a broken `equals`.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [mode, vitest, typescript] = process.argv.slice(2)

const package_ = /**
 * @type {{
 *   devDependencies: Record<string, string | undefined>
 *   scripts: Record<string, string>
 *   packageManager?: string
 * }}
 */ (JSON.parse(readFileSync('package.json', 'utf8')))

package_.devDependencies =
  mode === 'typecheck'
    ? { '@types/node': '*', typescript, vitest }
    : { '@vitest/coverage-istanbul': vitest, vitest }

package_.scripts = {
  test:
    mode === 'typecheck' ? 'vitest run --typecheck' : 'vitest run --coverage',
}

delete package_.packageManager

writeFileSync('package.json', JSON.stringify(package_, undefined, 2))
console.log('devDependencies:', JSON.stringify(package_.devDependencies))
