#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"

WITH_INFRA=false
FORCE=false
KILL_PORTS=false

log() {
  printf "[dev-stop] %s\n" "$*"
}

warn() {
  printf "[dev-stop][warn] %s\n" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage: bash scripts/dev-stop.sh [options]

Options:
  --with-infra  Also stop docker infrastructure (docker compose down)
  --force       Force kill app processes with SIGKILL
  --kill-ports  Also terminate listeners on ports 3001/3000
  -h, --help    Show this help
EOF
}

stop_from_pid_file() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    warn "$name PID file not found: $pid_file"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [[ -z "$pid" ]]; then
    warn "$name PID file empty: $pid_file"
    rm -f "$pid_file"
    return
  fi

  if ! kill -0 "$pid" >/dev/null 2>&1; then
    warn "$name is not running (stale PID: $pid)"
    rm -f "$pid_file"
    return
  fi

  if [[ "$FORCE" == "true" ]]; then
    log "Force stopping $name (PID $pid)..."
    kill -9 "$pid" >/dev/null 2>&1 || true
  else
    log "Stopping $name (PID $pid)..."
    kill "$pid" >/dev/null 2>&1 || true
    sleep 1
    if kill -0 "$pid" >/dev/null 2>&1; then
      warn "$name did not stop in time, using SIGKILL (PID $pid)"
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  fi

  rm -f "$pid_file"
}

kill_port_listener() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"

  if [[ -z "$pids" ]]; then
    return
  fi

  log "Terminating remaining listener(s) on port $port: $pids"
  if [[ "$FORCE" == "true" ]]; then
    kill -9 $pids >/dev/null 2>&1 || true
  else
    kill $pids >/dev/null 2>&1 || true
    sleep 1
    local still_running
    still_running="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$still_running" ]]; then
      warn "Port $port still in use after SIGTERM, using SIGKILL: $still_running"
      kill -9 $still_running >/dev/null 2>&1 || true
    fi
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-infra)
      WITH_INFRA=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --kill-ports)
      KILL_PORTS=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf "[dev-stop][error] Unknown argument: %s\n" "$1" >&2
      exit 1
      ;;
  esac
done

stop_from_pid_file "backend" "$PID_DIR/backend.pid"
stop_from_pid_file "frontend" "$PID_DIR/frontend.pid"

if [[ "$WITH_INFRA" == "true" ]]; then
  log "Stopping docker infrastructure..."
  (cd "$ROOT_DIR" && docker compose down)
fi

if [[ "$KILL_PORTS" == "true" ]]; then
  kill_port_listener 3001
  kill_port_listener 3000
fi

if lsof -tiTCP:3001 -sTCP:LISTEN >/dev/null 2>&1; then
  warn "Port 3001 is still in use by another process"
fi

if lsof -tiTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  warn "Port 3000 is still in use by another process"
fi

log "Done."
