#!/usr/bin/env bash
set -euo pipefail

compose() {
  docker compose -f "$(dirname "$0")/compose.yaml" \
    --profile runtime --profile typecheck "$@"
}

cleanup() {
  compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'cleanup; exit 130' INT TERM

environments=$(compose config --format json | jq -r '
  .services | to_entries[]
  | [.key, (.value.build.args.MODE // "runtime"), .value.build.args.NODE_VERSION,
     .value.build.args.VITEST_VERSION]
  | @tsv' | sort -k2,2 -k4,4V -k3,3n)
services=$(cut -f1 <<<"$environments")

# Must not be `|| true`: `up --no-build` would silently run a stale image.
compose build
compose up --detach --no-build --force-recreate || true
# shellcheck disable=SC2086
compose wait $services >/dev/null 2>&1 || true

for service in $services; do
  printf '\n=== %s ===\n' "$service"
  compose logs --no-log-prefix "$service" 2>/dev/null || echo '(did not start)'
done

printf '\n=== summary ===\n'
codes=$(compose ps -a --format '{{.Service}} {{.ExitCode}}')

failed=''
printf '%-6s  %-4s  %-6s  %s\n' KIND NODE VITEST RESULT
while IFS=$'\t' read -r service mode node vitest; do
  code=$(awk -v s="$service" '$1 == s { print $2 }' <<<"$codes" | tail -1)
  case "$code" in
    0) result='✅ PASS' ;;
    '') result='❌ FAIL (did not start)'; failed=y ;;
    *) result="❌ FAIL ($code)"; failed=y ;;
  esac
  printf '%-6s  %-4s  %-6s  %s\n' \
    "$([ "$mode" = typecheck ] && echo types || echo test)" "$node" "$vitest" "$result"
done <<<"$environments"

[ -z "$failed" ]
