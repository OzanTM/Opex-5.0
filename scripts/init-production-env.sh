#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_EXAMPLE="$ROOT_DIR/backend/.env.production.example"
FRONTEND_EXAMPLE="$ROOT_DIR/frontend/.env.production.example"
BACKEND_ENV="$ROOT_DIR/backend/.env.production"
FRONTEND_ENV="$ROOT_DIR/frontend/.env.production"
FORCE=false
DRY_RUN=false

log() {
  printf "[init-prod-env] %s\n" "$*"
}

warn() {
  printf "[init-prod-env][warn] %s\n" "$*" >&2
}

die() {
  printf "[init-prod-env][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/init-production-env.sh [options]

Options:
  --force     Overwrite existing .env.production files
  --dry-run   Print planned actions without writing files
  -h, --help  Show this help
EOF
}

copy_if_needed() {
  local source="$1"
  local target="$2"
  local label="$3"

  [[ -f "$source" ]] || die "Example file not found: $source"

  if [[ -f "$target" && "$FORCE" != "true" ]]; then
    warn "$label already exists: $target (kept as-is)"
    return
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log "[dry-run] copy $source -> $target"
    return
  fi

  cp "$source" "$target"
  log "$label initialized: $target"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
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

copy_if_needed "$BACKEND_EXAMPLE" "$BACKEND_ENV" "Backend env"
copy_if_needed "$FRONTEND_EXAMPLE" "$FRONTEND_ENV" "Frontend env"

if [[ "$DRY_RUN" == "true" ]]; then
  log "Dry-run completed."
  exit 0
fi

log "Next step: fill placeholder values in backend/.env.production and frontend/.env.production"
log "Then run: make validate-prod-env"
