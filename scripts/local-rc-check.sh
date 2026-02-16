#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  printf "[local-rc-check] %s\n" "$*"
}

log "Stopping local app processes for clean release-check ports..."
(cd "$ROOT_DIR" && bash scripts/dev-stop.sh) || true

log "Running release-check (backend/frontend build+test + e2e smoke)..."
(cd "$ROOT_DIR" && make release-check)

log "Running backend performance smoke (p95/p99)..."
(cd "$ROOT_DIR" && make perf-smoke)

log "Starting app stack for runtime health verification..."
(cd "$ROOT_DIR" && make start)

log "Running runtime health checks..."
(cd "$ROOT_DIR" && make ops-health-check)

log "All local release-candidate checks passed."
