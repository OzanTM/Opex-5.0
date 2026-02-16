#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
LOG_DIR="$ROOT_DIR/.logs"

BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost:3001/api/v1/health}"
TEMP_BACKEND_STARTED="false"

log() {
  printf "[perf-smoke] %s\n" "$*"
}

die() {
  printf "[perf-smoke][error] %s\n" "$*" >&2
  exit 1
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local retries="${3:-60}"

  for ((i = 1; i <= retries; i++)); do
    if curl -fsS -o /dev/null "$url" >/dev/null 2>&1; then
      log "$name is ready: $url"
      return 0
    fi
    sleep 1
  done

  return 1
}

cleanup() {
  if [[ "$TEMP_BACKEND_STARTED" == "true" && -n "${BACKEND_PID:-}" ]]; then
    log "Stopping temporary backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
    wait "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

command -v curl >/dev/null 2>&1 || die "curl command not found"
command -v npm >/dev/null 2>&1 || die "npm command not found"
command -v docker >/dev/null 2>&1 || die "docker command not found"

if ! wait_for_http "$BACKEND_HEALTH_URL" "Backend" 3; then
  log "Backend is not running, starting temporary backend for perf test..."
  mkdir -p "$LOG_DIR"

  (cd "$ROOT_DIR" && docker compose up -d postgres redis minio >/dev/null)
  (cd "$BACKEND_DIR" && npm run build >/dev/null)

  (
    cd "$BACKEND_DIR"
    NODE_ENV=test \
    PORT=3001 \
    API_PREFIX=/api/v1 \
    DATABASE_URL="postgresql://opex_user:opex_password@localhost:5432/opex_db?schema=public" \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_PASSWORD="" \
    JWT_SECRET="ci-jwt-secret" \
    JWT_EXPIRES_IN="7d" \
    JWT_REFRESH_EXPIRES_IN="30d" \
    FRONTEND_URL="http://localhost:3000" \
    EMAIL_PROVIDER="sendgrid" \
    SENDGRID_API_KEY="ci-dummy-sendgrid-key" \
    EMAIL_FROM="noreply@opex5.com" \
    EMAIL_FROM_NAME="OpEx 5.0" \
    UPLOAD_PROVIDER="local" \
    UPLOAD_DIR="./uploads" \
    MAX_FILE_SIZE="10485760" \
    ALLOWED_FILE_TYPES="pdf,doc,docx,xls,xlsx,jpg,png,gif" \
    LOG_LEVEL="info" \
    LOG_FILE="logs/opex.log" \
    BCRYPT_SALT_ROUNDS="12" \
    MAX_FAILED_LOGINS="5" \
    LOCKOUT_DURATION="900000" \
    RATE_LIMIT_PER_MINUTE="10000" \
    RATE_LIMIT_PER_HOUR="100000" \
    COMPANY_NAME="OpEx Company" \
    npm run start >"$LOG_DIR/perf-backend.log" 2>&1 &
    echo $! >"$LOG_DIR/perf-backend.pid"
  )

  BACKEND_PID="$(cat "$LOG_DIR/perf-backend.pid")"
  TEMP_BACKEND_STARTED="true"

  if ! wait_for_http "$BACKEND_HEALTH_URL" "Backend" 60; then
    tail -n 200 "$LOG_DIR/perf-backend.log" || true
    die "Temporary backend did not become ready."
  fi
fi

log "Running backend perf smoke..."
(cd "$BACKEND_DIR" && npm run perf:smoke)

log "Perf smoke finished successfully."
