#!/usr/bin/env bash
# Print a profile's compatibility environments as JSON, one object per compose
# service. CI feeds this to a job matrix; the build args carry the Node and
# Vitest versions the job names itself after.
#
#   ./compat/list-environments.sh runtime
set -euo pipefail

profile=${1:?usage: list-environments.sh <runtime|typecheck>}

docker compose -f "$(dirname "$0")/compose.yaml" --profile "$profile" \
  config --format json |
  jq -c '[.services | to_entries[] | {
      service: .key,
      node: .value.build.args.NODE_VERSION,
      vitest: .value.build.args.VITEST_VERSION
    }] | sort_by(.vitest, .node)'
