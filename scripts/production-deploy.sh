#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REF=""
BACKEND_SECRET_ID=""
FRONTEND_SECRET_ID=""
REGION="${AWS_REGION:-}"
RESTART_CMD=""
SKIP_INSTALL=false
SKIP_BUILD=false

log() {
  printf "[prod-deploy] %s\n" "$*"
}

die() {
  printf "[prod-deploy][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/production-deploy.sh --ref <git-ref> --backend-secret-id <id> --frontend-secret-id <id> [options]

Options:
  --ref <git-ref>             Git branch/tag/commit to deploy (required)
  --backend-secret-id <id>    AWS secret id for backend env (required)
  --frontend-secret-id <id>   AWS secret id for frontend env (required)
  --region <region>           AWS region (default: AWS_REGION env)
  --restart-cmd <command>     Service restart command after build/migrate
  --skip-install              Skip npm ci steps
  --skip-build                Skip backend/frontend build steps
  -h, --help                  Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      [[ $# -lt 2 ]] && die "--ref requires a value"
      REF="$2"
      shift 2
      ;;
    --backend-secret-id)
      [[ $# -lt 2 ]] && die "--backend-secret-id requires a value"
      BACKEND_SECRET_ID="$2"
      shift 2
      ;;
    --frontend-secret-id)
      [[ $# -lt 2 ]] && die "--frontend-secret-id requires a value"
      FRONTEND_SECRET_ID="$2"
      shift 2
      ;;
    --region)
      [[ $# -lt 2 ]] && die "--region requires a value"
      REGION="$2"
      shift 2
      ;;
    --restart-cmd)
      [[ $# -lt 2 ]] && die "--restart-cmd requires a value"
      RESTART_CMD="$2"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
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

[[ -n "$REF" ]] || die "--ref is required"
[[ -n "$BACKEND_SECRET_ID" ]] || die "--backend-secret-id is required"
[[ -n "$FRONTEND_SECRET_ID" ]] || die "--frontend-secret-id is required"
[[ -n "$REGION" ]] || die "--region is required (or set AWS_REGION)"

command -v git >/dev/null 2>&1 || die "git not found"
command -v npm >/dev/null 2>&1 || die "npm not found"

cd "$ROOT_DIR"

log "Fetching repository refs"
git fetch origin --tags

log "Checking out deploy ref: $REF"
git checkout "$REF"

if git show-ref --verify --quiet "refs/remotes/origin/$REF"; then
  log "Pulling latest for origin/$REF"
  git pull --ff-only origin "$REF"
fi

if [[ "$SKIP_INSTALL" == "false" ]]; then
  log "Installing backend dependencies"
  (cd "$ROOT_DIR/backend" && npm ci)

  log "Installing frontend dependencies"
  (cd "$ROOT_DIR/frontend" && npm ci)
fi

log "Syncing production secrets"
bash "$ROOT_DIR/scripts/production-sync-secrets.sh" \
  --backend-secret-id "$BACKEND_SECRET_ID" \
  --frontend-secret-id "$FRONTEND_SECRET_ID" \
  --region "$REGION" \
  --apply-runtime-files

log "Applying database migrations"
(cd "$ROOT_DIR/backend" && npx prisma migrate deploy && npx prisma generate)

if [[ "$SKIP_BUILD" == "false" ]]; then
  log "Building backend"
  (cd "$ROOT_DIR/backend" && npm run build)

  log "Building frontend"
  (cd "$ROOT_DIR/frontend" && npm run build)
fi

if [[ -n "$RESTART_CMD" ]]; then
  log "Restarting services"
  bash -lc "$RESTART_CMD"
else
  log "No restart command provided. Restart services manually."
fi

log "Deployment script completed."
