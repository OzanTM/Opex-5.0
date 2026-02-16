#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_ENV_FILE="$ROOT_DIR/backend/.env.production"
FRONTEND_ENV_FILE="$ROOT_DIR/frontend/.env.production"
APP_DOMAIN=""
API_DOMAIN=""
APP_DIR=""
RUN_USER=""
RUN_GROUP=""
SKIP_HTTPS_CHECK=false
RUN_MONITORING_CHECK=false

FAIL_COUNT=0

log() {
  printf "[preprod-check] %s\n" "$*"
}

warn() {
  printf "[preprod-check][warn] %s\n" "$*" >&2
}

fail() {
  printf "[preprod-check][fail] %s\n" "$*" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

usage() {
  cat <<EOF
Usage: bash scripts/preprod-check.sh [options]

Options:
  --backend-env-file <path>   Backend production env file (default: backend/.env.production)
  --frontend-env-file <path>  Frontend production env file (default: frontend/.env.production)
  --app-domain <domain>       App domain for nginx+dns checks (required)
  --api-domain <domain>       API domain for nginx+dns checks (required)
  --app-dir <path>            Server app dir for systemd render (required)
  --run-user <user>           Service user for systemd render (required)
  --run-group <group>         Service group for systemd render (optional)
  --skip-https-check          Skip live HTTPS checks in domain preflight
  --run-monitoring-check      Also run monitoring endpoint checks (Prometheus/Grafana/Alertmanager)
  -h, --help                  Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-env-file)
      [[ $# -lt 2 ]] && { echo "--backend-env-file requires a value" >&2; exit 1; }
      BACKEND_ENV_FILE="$2"
      shift 2
      ;;
    --frontend-env-file)
      [[ $# -lt 2 ]] && { echo "--frontend-env-file requires a value" >&2; exit 1; }
      FRONTEND_ENV_FILE="$2"
      shift 2
      ;;
    --app-domain)
      [[ $# -lt 2 ]] && { echo "--app-domain requires a value" >&2; exit 1; }
      APP_DOMAIN="$2"
      shift 2
      ;;
    --api-domain)
      [[ $# -lt 2 ]] && { echo "--api-domain requires a value" >&2; exit 1; }
      API_DOMAIN="$2"
      shift 2
      ;;
    --app-dir)
      [[ $# -lt 2 ]] && { echo "--app-dir requires a value" >&2; exit 1; }
      APP_DIR="$2"
      shift 2
      ;;
    --run-user)
      [[ $# -lt 2 ]] && { echo "--run-user requires a value" >&2; exit 1; }
      RUN_USER="$2"
      shift 2
      ;;
    --run-group)
      [[ $# -lt 2 ]] && { echo "--run-group requires a value" >&2; exit 1; }
      RUN_GROUP="$2"
      shift 2
      ;;
    --skip-https-check)
      SKIP_HTTPS_CHECK=true
      shift
      ;;
    --run-monitoring-check)
      RUN_MONITORING_CHECK=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

log "Step 1/4: Validate production env files"
if [[ ! -f "$BACKEND_ENV_FILE" ]]; then
  fail "Backend env file not found: $BACKEND_ENV_FILE"
fi
if [[ ! -f "$FRONTEND_ENV_FILE" ]]; then
  fail "Frontend env file not found: $FRONTEND_ENV_FILE"
fi
if [[ -f "$BACKEND_ENV_FILE" && -f "$FRONTEND_ENV_FILE" ]]; then
  if bash "$ROOT_DIR/scripts/validate-production-env.sh" --backend-file "$BACKEND_ENV_FILE" --frontend-file "$FRONTEND_ENV_FILE"; then
    log "Env validation passed."
  else
    fail "Env validation failed."
  fi
fi

log "Step 2/4: Render systemd units"
if [[ -z "$APP_DIR" || -z "$RUN_USER" ]]; then
  fail "Systemd render requires --app-dir and --run-user."
else
  if bash "$ROOT_DIR/scripts/render-systemd-units.sh" --app-dir "$APP_DIR" --run-user "$RUN_USER" --run-group "${RUN_GROUP:-$RUN_USER}" --out-dir "$ROOT_DIR/ops/systemd/generated"; then
    log "Systemd unit render passed."
  else
    fail "Systemd unit render failed."
  fi
fi

log "Step 3/4: Render nginx config + domain preflight"
if [[ -z "$APP_DOMAIN" || -z "$API_DOMAIN" ]]; then
  fail "Nginx/domain checks require --app-domain and --api-domain."
else
  if bash "$ROOT_DIR/scripts/render-nginx-config.sh" --app-domain "$APP_DOMAIN" --api-domain "$API_DOMAIN" --out "$ROOT_DIR/ops/nginx/generated/opex.preprod.conf"; then
    log "Nginx render passed."
  else
    fail "Nginx render failed."
  fi

  if [[ "$SKIP_HTTPS_CHECK" == "true" ]]; then
    if bash "$ROOT_DIR/scripts/domain-ssl-preflight.sh" --app-domain "$APP_DOMAIN" --api-domain "$API_DOMAIN" --skip-https-check; then
      log "Domain preflight passed (HTTPS skipped)."
    else
      fail "Domain preflight failed (HTTPS skipped)."
    fi
  else
    if bash "$ROOT_DIR/scripts/domain-ssl-preflight.sh" --app-domain "$APP_DOMAIN" --api-domain "$API_DOMAIN"; then
      log "Domain + HTTPS preflight passed."
    else
      fail "Domain + HTTPS preflight failed."
    fi
  fi
fi

log "Step 4/4: Render monitoring targets"
if bash "$ROOT_DIR/scripts/render-monitoring-config.sh" --out "$ROOT_DIR/ops/monitoring/prometheus.generated.yml"; then
  log "Monitoring target render passed."
else
  fail "Monitoring target render failed."
fi

if [[ "$RUN_MONITORING_CHECK" == "true" ]]; then
  if bash "$ROOT_DIR/scripts/monitoring-check.sh"; then
    log "Monitoring endpoint checks passed."
  else
    fail "Monitoring endpoint checks failed."
  fi
else
  warn "Monitoring endpoint check skipped (use --run-monitoring-check)."
fi

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  printf "[preprod-check][result] FAILED (%s issue)\n" "$FAIL_COUNT" >&2
  exit 1
fi

log "All pre-production checks passed."
