#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/.logs"

BACKEND_PORT=3001
FRONTEND_PORT=3000

log() {
  printf "[e2e-smoke] %s\n" "$*"
}

die() {
  printf "[e2e-smoke][error] %s\n" "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local retries="${3:-90}"

  for ((i = 1; i <= retries; i++)); do
    if curl -fsS -o /dev/null "$url" >/dev/null 2>&1; then
      log "$name is ready: $url"
      return 0
    fi
    sleep 1
  done

  die "$name did not become ready: $url"
}

require_cmd node
require_cmd npm
require_cmd docker
require_cmd curl
require_cmd lsof

if lsof -ti :"$BACKEND_PORT" >/dev/null 2>&1; then
  die "Port $BACKEND_PORT is in use. Run 'make stop' and try again."
fi

if lsof -ti :"$FRONTEND_PORT" >/dev/null 2>&1; then
  die "Port $FRONTEND_PORT is in use. Run 'make stop' and try again."
fi

mkdir -p "$LOG_DIR"

log "Starting docker infrastructure (postgres, redis, minio)..."
(cd "$ROOT_DIR" && docker compose up -d postgres redis minio)

if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  log "Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm ci)
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm ci)
fi

log "Resetting and seeding database..."
(
  cd "$BACKEND_DIR"
  npx prisma migrate reset --force --skip-seed
  npm run db:seed
)

log "Building backend..."
(cd "$BACKEND_DIR" && npm run build)

log "Building frontend..."
(cd "$FRONTEND_DIR" && NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT/api/v1" npm run build)

log "Installing Playwright Chromium (if needed)..."
(cd "$FRONTEND_DIR" && npx playwright install chromium)

log "Preparing standalone frontend output..."
(
  cd "$FRONTEND_DIR"
  mkdir -p .next/standalone/.next
  rm -rf .next/standalone/.next/static
  cp -R .next/static .next/standalone/.next/

  if [[ -d public ]]; then
    rm -rf .next/standalone/public
    cp -R public .next/standalone/
  fi
)

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

log "Starting backend..."
(
  cd "$BACKEND_DIR"
  NODE_ENV=test \
  PORT=$BACKEND_PORT \
  API_PREFIX=/api/v1 \
  DATABASE_URL="postgresql://opex_user:opex_password@localhost:5432/opex_db?schema=public" \
  REDIS_HOST=localhost \
  REDIS_PORT=6379 \
  REDIS_PASSWORD="" \
  JWT_SECRET="ci-jwt-secret" \
  JWT_EXPIRES_IN="7d" \
  JWT_REFRESH_EXPIRES_IN="30d" \
  FRONTEND_URL="http://localhost:$FRONTEND_PORT" \
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
  npm run start >"$LOG_DIR/e2e-backend.log" 2>&1 &
  BACKEND_PID=$!
  echo "$BACKEND_PID" > "$LOG_DIR/e2e-backend.pid"
)
BACKEND_PID="$(cat "$LOG_DIR/e2e-backend.pid")"

log "Starting frontend standalone..."
(
  cd "$FRONTEND_DIR/.next/standalone"
  PORT=$FRONTEND_PORT \
  HOSTNAME=0.0.0.0 \
  NODE_ENV=test \
  NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT/api/v1" \
  node server.js >"$LOG_DIR/e2e-frontend.log" 2>&1 &
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" > "$LOG_DIR/e2e-frontend.pid"
)
FRONTEND_PID="$(cat "$LOG_DIR/e2e-frontend.pid")"

wait_for_http "http://localhost:$BACKEND_PORT/api/v1/health" "Backend"
wait_for_http "http://localhost:$FRONTEND_PORT" "Frontend"

log "Running Playwright smoke tests..."
(
  cd "$FRONTEND_DIR"
  PLAYWRIGHT_BASE_URL="http://localhost:$FRONTEND_PORT" npm run test:e2e:smoke
)

log "Smoke tests passed."
log "Logs: $LOG_DIR/e2e-backend.log and $LOG_DIR/e2e-frontend.log"
