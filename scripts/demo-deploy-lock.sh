#!/bin/bash

# Demo Deploy Lock（複用待神 dashboard-lock.sh 的寫法，鎖目錄各自獨立不共用）
# Usage: demo-deploy-lock.sh acquire|release|check <case-slug>
# Lock location: ~/.claude/locks/anson-demos/<case-slug>.lock

set -e

LOCK_DIR="$HOME/.claude/locks/anson-demos"
LOCK_EXPIRY_SECONDS=$((10 * 60))

function die() {
  echo "❌ $@" >&2
  exit 1
}

function acquire_lock() {
  local case_slug="$1"
  local lock_file="$LOCK_DIR/${case_slug}.lock"
  local holder="${HOLDER:-$(whoami)-$(date +%s)}"
  local acquired_at=$(date -u +"%Y-%m-%dT%H:%M:%S%z")

  mkdir -p "$LOCK_DIR"

  if [[ -f "$lock_file" ]]; then
    local lock_content=$(cat "$lock_file")
    local lock_holder=$(echo "$lock_content" | jq -r '.holder' 2>/dev/null || echo "unknown")
    local lock_acquired=$(echo "$lock_content" | jq -r '.acquired_at' 2>/dev/null || echo "0")

    if [[ -n "$lock_acquired" && "$lock_acquired" != "0" ]]; then
      local lock_timestamp=$(date -j -f "%Y-%m-%dT%H:%M:%S%z" "$lock_acquired" +%s 2>/dev/null || echo "0")
      local current_timestamp=$(date +%s)
      local age=$((current_timestamp - lock_timestamp))

      if (( age < LOCK_EXPIRY_SECONDS )); then
        die "${case_slug} Demo 目前被 ${lock_holder} 鎖住，${lock_acquired} 開始，請稍後再試"
      else
        rm -f "$lock_file"
      fi
    fi
  fi

  local lock_json=$(cat <<EOF
{
  "holder": "$holder",
  "acquired_at": "$acquired_at"
}
EOF
)
  echo "$lock_json" > "$lock_file"
  echo "✅ Lock acquired for $case_slug by $holder"
}

function release_lock() {
  local case_slug="$1"
  local lock_file="$LOCK_DIR/${case_slug}.lock"

  if [[ -f "$lock_file" ]]; then
    rm -f "$lock_file"
    echo "✅ Lock released for $case_slug"
  else
    echo "⚠️  No lock found for $case_slug"
  fi
}

if [[ $# -lt 2 ]]; then
  die "Usage: $0 acquire|release <case-slug>"
fi

COMMAND="$1"
CASE_SLUG="$2"

case "$COMMAND" in
  acquire) acquire_lock "$CASE_SLUG" ;;
  release) release_lock "$CASE_SLUG" ;;
  *) die "Unknown command: $COMMAND. Use acquire|release" ;;
esac
