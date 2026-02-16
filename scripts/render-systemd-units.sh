#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR=""
RUN_USER=""
RUN_GROUP=""
BACKEND_PORT="3001"
FRONTEND_PORT="3000"
OUT_DIR="$ROOT_DIR/ops/systemd/generated"
BACKEND_TEMPLATE="$ROOT_DIR/ops/systemd/opex-backend.service.template"
FRONTEND_TEMPLATE="$ROOT_DIR/ops/systemd/opex-frontend.service.template"

log() {
  printf "[systemd-render] %s\n" "$*"
}

die() {
  printf "[systemd-render][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/render-systemd-units.sh --app-dir <path> --run-user <user> [options]

Options:
  --app-dir <path>        Absolute app directory on server (required)
  --run-user <user>       Service user (required)
  --run-group <group>     Service group (default: run-user)
  --backend-port <port>   Backend port (default: 3001)
  --frontend-port <port>  Frontend port (default: 3000)
  --out-dir <path>        Output directory (default: ops/systemd/generated)
  -h, --help              Show this help
EOF
}

render_file() {
  local template="$1"
  local out_file="$2"
  local content

  content="$(cat "$template")"
  content="${content//'{{APP_DIR}}'/$APP_DIR}"
  content="${content//'{{RUN_USER}}'/$RUN_USER}"
  content="${content//'{{RUN_GROUP}}'/$RUN_GROUP}"
  content="${content//'{{BACKEND_PORT}}'/$BACKEND_PORT}"
  content="${content//'{{FRONTEND_PORT}}'/$FRONTEND_PORT}"

  printf '%s\n' "$content" >"$out_file"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir)
      [[ $# -lt 2 ]] && die "--app-dir requires a value"
      APP_DIR="$2"
      shift 2
      ;;
    --run-user)
      [[ $# -lt 2 ]] && die "--run-user requires a value"
      RUN_USER="$2"
      shift 2
      ;;
    --run-group)
      [[ $# -lt 2 ]] && die "--run-group requires a value"
      RUN_GROUP="$2"
      shift 2
      ;;
    --backend-port)
      [[ $# -lt 2 ]] && die "--backend-port requires a value"
      BACKEND_PORT="$2"
      shift 2
      ;;
    --frontend-port)
      [[ $# -lt 2 ]] && die "--frontend-port requires a value"
      FRONTEND_PORT="$2"
      shift 2
      ;;
    --out-dir)
      [[ $# -lt 2 ]] && die "--out-dir requires a path"
      OUT_DIR="$2"
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

[[ -n "$APP_DIR" ]] || die "--app-dir is required"
[[ -n "$RUN_USER" ]] || die "--run-user is required"
[[ -f "$BACKEND_TEMPLATE" ]] || die "Backend template not found: $BACKEND_TEMPLATE"
[[ -f "$FRONTEND_TEMPLATE" ]] || die "Frontend template not found: $FRONTEND_TEMPLATE"

if [[ -z "$RUN_GROUP" ]]; then
  RUN_GROUP="$RUN_USER"
fi

[[ "$BACKEND_PORT" =~ ^[0-9]+$ ]] || die "--backend-port must be numeric"
[[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || die "--frontend-port must be numeric"

mkdir -p "$OUT_DIR"

BACKEND_OUT="$OUT_DIR/opex-backend.service"
FRONTEND_OUT="$OUT_DIR/opex-frontend.service"

render_file "$BACKEND_TEMPLATE" "$BACKEND_OUT"
render_file "$FRONTEND_TEMPLATE" "$FRONTEND_OUT"

log "Rendered: $BACKEND_OUT"
log "Rendered: $FRONTEND_OUT"
log "Install example:"
log "  sudo cp \"$BACKEND_OUT\" \"$FRONTEND_OUT\" /etc/systemd/system/"
log "  sudo mkdir -p /var/log/opex && sudo chown -R $RUN_USER:$RUN_GROUP /var/log/opex"
log "  sudo systemctl daemon-reload"
log "  sudo systemctl enable --now opex-backend opex-frontend"
