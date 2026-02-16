#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/ops/monitoring/prometheus.yml.template"
OUT_FILE="$ROOT_DIR/ops/monitoring/prometheus.generated.yml"
FRONTEND_PROBE_URL="http://host.docker.internal:3000"
BACKEND_HEALTH_URL="http://host.docker.internal:3001/api/v1/health"

log() {
  printf "[monitoring-render] %s\n" "$*"
}

die() {
  printf "[monitoring-render][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/render-monitoring-config.sh [options]

Options:
  --frontend-url <url>        Frontend probe URL (default: http://host.docker.internal:3000)
  --backend-health-url <url>  Backend health URL (default: http://host.docker.internal:3001/api/v1/health)
  --template <path>           Template path (default: ops/monitoring/prometheus.yml.template)
  --out <path>                Output path (default: ops/monitoring/prometheus.generated.yml)
  -h, --help                  Show this help
EOF
}

is_valid_url() {
  local url="$1"
  [[ "$url" =~ ^https?://.+$ ]]
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --frontend-url)
      [[ $# -lt 2 ]] && die "--frontend-url requires a value"
      FRONTEND_PROBE_URL="$2"
      shift 2
      ;;
    --backend-health-url)
      [[ $# -lt 2 ]] && die "--backend-health-url requires a value"
      BACKEND_HEALTH_URL="$2"
      shift 2
      ;;
    --template)
      [[ $# -lt 2 ]] && die "--template requires a path"
      TEMPLATE_FILE="$2"
      shift 2
      ;;
    --out)
      [[ $# -lt 2 ]] && die "--out requires a path"
      OUT_FILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

[[ -f "$TEMPLATE_FILE" ]] || die "Template not found: $TEMPLATE_FILE"
is_valid_url "$FRONTEND_PROBE_URL" || die "Invalid --frontend-url: $FRONTEND_PROBE_URL"
is_valid_url "$BACKEND_HEALTH_URL" || die "Invalid --backend-health-url: $BACKEND_HEALTH_URL"

content="$(cat "$TEMPLATE_FILE")"
content="${content//'{{FRONTEND_PROBE_URL}}'/$FRONTEND_PROBE_URL}"
content="${content//'{{BACKEND_HEALTH_URL}}'/$BACKEND_HEALTH_URL}"

mkdir -p "$(dirname "$OUT_FILE")"
printf '%s\n' "$content" >"$OUT_FILE"

log "Rendered monitoring config: $OUT_FILE"
log "Frontend probe URL: $FRONTEND_PROBE_URL"
log "Backend health URL: $BACKEND_HEALTH_URL"
