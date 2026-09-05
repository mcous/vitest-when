#!/bin/sh
# Entrypoint for a compatibility cell. The cell's package.json carries the
# right `test` script for its mode, written by apply-cell.mjs at build time.
set -e

echo "node $(node --version) / vitest $(node -p "require('vitest/package.json').version") / npm $(npm --version)"

# Resolution smoke test: proves the exports map works with no bundler in the
# loop, and that @vitest/expect hoisted from vitest. Runs in every cell, and in
# the ones whose coverage entry is `src` it is the only check on dist.
node -e "import('vitest-when').then((m) => {
  console.log('exports:', Object.keys(m).sort().join(','))
})"

exec npm test
