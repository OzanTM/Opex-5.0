#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PID_DIR="$ROOT_DIR/.pids"
LOG_DIR="$ROOT_DIR/.logs"

BOOTSTRAP=false
SEED=false
RESET_DB=false
STATUS_ONLY=false

log() {
  printf "[dev-start] %s\n" "$*"
}

warn() {
  printf "[dev-start][warn] %s\n" "$*" >&2
}

die() {
  printf "[dev-start][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: bash scripts/dev-start.sh [options]

Options:
  --bootstrap   Run npm ci for backend and frontend
  --seed        Run backend seed after DB prep
  --reset-db    Reset DB with prisma migrate reset (destructive)
  --status      Print current local status only
  -h, --help    Show this help
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local retries="${3:-45}"

  for ((i = 1; i <= retries; i++)); do
    if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      log "$name port $port is ready"
      return 0
    fi
    sleep 1
  done

  die "$name port $port did not become ready"
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

  die "$name did not become ready: $url"
}

install_if_needed() {
  local dir="$1"
  local name="$2"

  if [[ "$BOOTSTRAP" == "true" || ! -d "$dir/node_modules" ]]; then
    log "Installing $name dependencies..."
    (cd "$dir" && npm ci)
  else
    log "$name dependencies already installed"
  fi
}

prepare_backend_db() {
  log "Preparing backend database..."

  if [[ "$RESET_DB" == "true" ]]; then
    log "Resetting DB (destructive)..."
    (cd "$BACKEND_DIR" && npx prisma migrate reset --force --skip-seed)
  else
    (cd "$BACKEND_DIR" && npx prisma migrate deploy)
  fi

  (cd "$BACKEND_DIR" && npx prisma generate)

  if [[ "$SEED" == "true" ]]; then
    (cd "$BACKEND_DIR" && npm run db:seed)
  fi
}

start_backend() {
  mkdir -p "$PID_DIR" "$LOG_DIR"

  if lsof -ti :3001 >/dev/null 2>&1; then
    warn "Port 3001 already in use. Assuming backend is already running."
    wait_for_http "http://localhost:3001/api/v1/health" "Backend" 20
    return
  fi

  log "Starting backend on 3001..."
  (
    cd "$BACKEND_DIR"
    nohup npm run dev >"$LOG_DIR/backend.log" 2>&1 &
    echo $! >"$PID_DIR/backend.pid"
  )

  wait_for_http "http://localhost:3001/api/v1/health" "Backend" 60
}

start_frontend() {
  mkdir -p "$PID_DIR" "$LOG_DIR"

  if lsof -ti :3000 >/dev/null 2>&1; then
    warn "Port 3000 already in use. Assuming frontend is already running."
    wait_for_http "http://localhost:3000" "Frontend" 20
    return
  fi

  log "Starting frontend on 3000..."
  (
    cd "$FRONTEND_DIR"
    nohup npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
    echo $! >"$PID_DIR/frontend.pid"
  )

  wait_for_http "http://localhost:3000" "Frontend" 80
}

show_status() {
  log "Docker services:"
  (cd "$ROOT_DIR" && docker compose ps) || true
  echo

  if curl -fsS -o /dev/null "http://localhost:3001/api/v1/health" >/dev/null 2>&1; then
    log "Backend health: OK"
  else
    warn "Backend health: NOT READY"
  fi

  if curl -fsS -o /dev/null "http://localhost:3000" >/dev/null 2>&1; then
    log "Frontend: reachable"
  else
    warn "Frontend: NOT READY"
  fi

  if [[ -f "$PID_DIR/backend.pid" ]]; then
    log "Backend PID file: $PID_DIR/backend.pid ($(cat "$PID_DIR/backend.pid"))"
  else
    warn "Backend PID file missing"
  fi

  if [[ -f "$PID_DIR/frontend.pid" ]]; then
    log "Frontend PID file: $PID_DIR/frontend.pid ($(cat "$PID_DIR/frontend.pid"))"
  else
    warn "Frontend PID file missing"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bootstrap)
      BOOTSTRAP=true
      shift
      ;;
    --seed)
      SEED=true
      shift
      ;;
    --reset-db)
      RESET_DB=true
      shift
      ;;
    --status)
      STATUS_ONLY=true
      shift
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

require_cmd node
require_cmd npm
require_cmd docker
require_cmd curl
require_cmd lsof

if [[ "$STATUS_ONLY" == "true" ]]; then
  show_status
  exit 0
fi

mkdir -p "$PID_DIR" "$LOG_DIR"

log "Starting docker infrastructure..."
(cd "$ROOT_DIR" && docker compose up -d postgres redis minio)
wait_for_port 5432 "Postgres" 60
wait_for_port 6379 "Redis" 60

install_if_needed "$BACKEND_DIR" "backend"
install_if_needed "$FRONTEND_DIR" "frontend"
prepare_backend_db
start_backend
start_frontend
show_status

log "Done."
log "Frontend: http://localhost:3000"
log "Backend:  http://localhost:3001/api/v1/health"
log "Logs: tail -f $LOG_DIR/backend.log $LOG_DIR/frontend.log"
