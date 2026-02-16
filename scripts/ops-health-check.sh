#!/usr/bin/env bash
set -euo pipefail

BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost:3001/api/v1/health}"
BACKEND_DOCS_URL="${BACKEND_DOCS_URL:-http://localhost:3001/api-docs.json}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

log() {
  printf "[ops-health] %s\n" "$*"
}

die() {
  printf "[ops-health][error] %s\n" "$*" >&2
  exit 1
}

check_url() {
  local url="$1"
  local name="$2"

  if ! curl -fsS -o /dev/null "$url"; then
    die "$name failed: $url"
  fi

  log "$name OK: $url"
}

command -v curl >/dev/null 2>&1 || die "curl command not found"

check_url "$BACKEND_HEALTH_URL" "Backend health"
check_url "$BACKEND_DOCS_URL" "Backend docs"
check_url "$FRONTEND_URL" "Frontend"

log "All checks passed."
