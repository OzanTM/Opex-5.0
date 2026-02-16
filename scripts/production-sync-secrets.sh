#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_SECRET_ID=""
FRONTEND_SECRET_ID=""
REGION="${AWS_REGION:-}"
BACKEND_OUT="$ROOT_DIR/backend/.env.production"
FRONTEND_OUT="$ROOT_DIR/frontend/.env.production"
BACKEND_RUNTIME_FILE="$ROOT_DIR/backend/.env"
APPLY_RUNTIME_FILES=false

log() {
  printf "[prod-secrets] %s\n" "$*"
}

die() {
  printf "[prod-secrets][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/production-sync-secrets.sh --backend-secret-id <id> --frontend-secret-id <id> [options]

Options:
  --backend-secret-id <id>   AWS secret id for backend env (required)
  --frontend-secret-id <id>  AWS secret id for frontend env (required)
  --region <region>          AWS region (default: AWS_REGION env)
  --backend-out <path>       Backend env output (default: backend/.env.production)
  --frontend-out <path>      Frontend env output (default: frontend/.env.production)
  --backend-runtime <path>   Backend runtime env file (default: backend/.env)
  --apply-runtime-files      Copy backend production env to runtime env path
  -h, --help                 Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
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
    --backend-out)
      [[ $# -lt 2 ]] && die "--backend-out requires a path"
      BACKEND_OUT="$2"
      shift 2
      ;;
    --frontend-out)
      [[ $# -lt 2 ]] && die "--frontend-out requires a path"
      FRONTEND_OUT="$2"
      shift 2
      ;;
    --backend-runtime)
      [[ $# -lt 2 ]] && die "--backend-runtime requires a path"
      BACKEND_RUNTIME_FILE="$2"
      shift 2
      ;;
    --apply-runtime-files)
      APPLY_RUNTIME_FILES=true
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

[[ -n "$BACKEND_SECRET_ID" ]] || die "--backend-secret-id is required"
[[ -n "$FRONTEND_SECRET_ID" ]] || die "--frontend-secret-id is required"
[[ -n "$REGION" ]] || die "--region is required (or set AWS_REGION)"

log "Syncing backend secrets from AWS: $BACKEND_SECRET_ID"
bash "$ROOT_DIR/scripts/aws-secrets-to-env.sh" \
  --secret-id "$BACKEND_SECRET_ID" \
  --region "$REGION" \
  --out "$BACKEND_OUT"

log "Syncing frontend secrets from AWS: $FRONTEND_SECRET_ID"
bash "$ROOT_DIR/scripts/aws-secrets-to-env.sh" \
  --secret-id "$FRONTEND_SECRET_ID" \
  --region "$REGION" \
  --out "$FRONTEND_OUT"

log "Validating production env files"
bash "$ROOT_DIR/scripts/validate-production-env.sh" \
  --backend-file "$BACKEND_OUT" \
  --frontend-file "$FRONTEND_OUT"

if [[ "$APPLY_RUNTIME_FILES" == "true" ]]; then
  log "Applying backend runtime env file: $BACKEND_RUNTIME_FILE"
  mkdir -p "$(dirname "$BACKEND_RUNTIME_FILE")"
  cp "$BACKEND_OUT" "$BACKEND_RUNTIME_FILE"
  chmod 600 "$BACKEND_RUNTIME_FILE"
fi

log "Secret sync completed successfully."
