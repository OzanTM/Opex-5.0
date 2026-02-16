#!/usr/bin/env bash
set -euo pipefail

SECRET_ID=""
REGION="${AWS_REGION:-}"
OUT_FILE=""

log() {
  printf "[aws-secrets] %s\n" "$*"
}

die() {
  printf "[aws-secrets][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/aws-secrets-to-env.sh --secret-id <id> --out <file> [options]

Options:
  --secret-id <id>   AWS Secrets Manager secret id/name/arn (required)
  --out <file>       Output .env file path (required)
  --region <region>  AWS region (default: AWS_REGION env)
  -h, --help         Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --secret-id)
      [[ $# -lt 2 ]] && die "--secret-id requires a value"
      SECRET_ID="$2"
      shift 2
      ;;
    --region)
      [[ $# -lt 2 ]] && die "--region requires a value"
      REGION="$2"
      shift 2
      ;;
    --out)
      [[ $# -lt 2 ]] && die "--out requires a file path"
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

[[ -n "$SECRET_ID" ]] || die "--secret-id is required"
[[ -n "$OUT_FILE" ]] || die "--out is required"
[[ -n "$REGION" ]] || die "--region is required (or set AWS_REGION)"

command -v aws >/dev/null 2>&1 || die "aws CLI not found"
command -v node >/dev/null 2>&1 || die "node not found"

log "Fetching secret from AWS Secrets Manager"
SECRET_STRING="$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$REGION" \
  --query SecretString \
  --output text)"

[[ -n "$SECRET_STRING" && "$SECRET_STRING" != "None" ]] || die "SecretString is empty"

mkdir -p "$(dirname "$OUT_FILE")"

printf '%s' "$SECRET_STRING" | node - "$OUT_FILE" <<'NODE'
const fs = require('fs');

const outFile = process.argv[2];
const input = fs.readFileSync(0, 'utf8');

let parsed;
try {
  parsed = JSON.parse(input);
} catch (error) {
  console.error(`[aws-secrets][error] SecretString is not valid JSON: ${error.message}`);
  process.exit(1);
}

if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
  console.error('[aws-secrets][error] Secret JSON must be an object');
  process.exit(1);
}

const lines = [];
for (const key of Object.keys(parsed).sort()) {
  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    console.error(`[aws-secrets][error] Invalid env key format: ${key}`);
    process.exit(1);
  }

  const rawValue = parsed[key];
  if (rawValue === null || rawValue === undefined) {
    continue;
  }

  lines.push(`${key}=${JSON.stringify(String(rawValue))}`);
}

fs.writeFileSync(outFile, `${lines.join('\n')}\n`, { mode: 0o600 });
NODE

chmod 600 "$OUT_FILE"
log "Env file created: $OUT_FILE"
