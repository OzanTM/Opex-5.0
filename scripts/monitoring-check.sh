#!/usr/bin/env bash
set -euo pipefail

PROM_URL="${PROM_URL:-http://localhost:9090/-/ready}"
ALERT_URL="${ALERT_URL:-http://localhost:9093/-/ready}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3005/api/health}"
RETRIES="${RETRIES:-30}"

log() {
  printf "[monitoring-check] %s\n" "$*"
}

die() {
  printf "[monitoring-check][error] %s\n" "$*" >&2
  exit 1
}

check_url() {
  local name="$1"
  local url="$2"
  local retries="$3"

  for ((i = 1; i <= retries; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "$name OK: $url"
      return 0
    fi
    sleep 1
  done

  die "$name failed after ${retries}s: $url"
}

check_url "Prometheus" "$PROM_URL" "$RETRIES"
check_url "Alertmanager" "$ALERT_URL" "$RETRIES"
check_url "Grafana" "$GRAFANA_URL" "$RETRIES"

log "All monitoring endpoints are reachable."
