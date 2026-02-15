#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OWNER=""
REPO=""
BRANCH="main"
APPLY=false

usage() {
  cat <<'USAGE'
Usage: bash scripts/setup-branch-protection.sh [options]

Options:
  --owner <owner>    GitHub owner/org (auto-detected from origin if omitted)
  --repo <repo>      GitHub repo name (auto-detected from origin if omitted)
  --branch <branch>  Branch name (default: main)
  --apply            Apply protection via GitHub API (requires GITHUB_TOKEN)
  --help             Show this help

Examples:
  bash scripts/setup-branch-protection.sh
  GITHUB_TOKEN=xxx bash scripts/setup-branch-protection.sh --apply
USAGE
}

log() {
  printf "[branch-protect] %s\n" "$*"
}

die() {
  printf "[branch-protect][error] %s\n" "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner)
      OWNER="$2"
      shift 2
      ;;
    --repo)
      REPO="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --apply)
      APPLY=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

if [[ -z "$OWNER" || -z "$REPO" ]]; then
  REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
  [[ -n "$REMOTE_URL" ]] || die "Could not read origin remote"

  CLEAN="$REMOTE_URL"
  CLEAN="${CLEAN#git@github.com:}"
  CLEAN="${CLEAN#https://github.com/}"
  CLEAN="${CLEAN#http://github.com/}"
  CLEAN="${CLEAN%.git}"

  [[ "$CLEAN" == */* ]] || die "Could not parse owner/repo from origin: $REMOTE_URL"

  OWNER="${OWNER:-${CLEAN%%/*}}"
  REPO="${REPO:-${CLEAN#*/}}"
fi

PAYLOAD=$(cat <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Backend Build and Test",
      "Frontend Build and Test",
      "E2E Smoke (Chromium)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON
)

API_URL="https://api.github.com/repos/$OWNER/$REPO/branches/$BRANCH/protection"

log "Repository: $OWNER/$REPO"
log "Branch: $BRANCH"
log "Endpoint: $API_URL"

if [[ "$APPLY" != "true" ]]; then
  log "Dry-run mode. Add --apply to send API request."
  printf '%s\n' "$PAYLOAD"
  exit 0
fi

command -v curl >/dev/null 2>&1 || die "curl is required"
[[ -n "${GITHUB_TOKEN:-}" ]] || die "GITHUB_TOKEN is required for --apply"

log "Applying branch protection..."
RESPONSE=$(curl -sS -w "\n%{http_code}" \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "$API_URL" \
  -d "$PAYLOAD")

STATUS_CODE="$(printf '%s' "$RESPONSE" | tail -n1)"
BODY="$(printf '%s' "$RESPONSE" | sed '$d')"

if [[ "$STATUS_CODE" =~ ^2[0-9][0-9]$ ]]; then
  log "Branch protection applied successfully (HTTP $STATUS_CODE)."
  exit 0
fi

printf '%s\n' "$BODY"
die "Failed to apply branch protection (HTTP $STATUS_CODE)"
