#!/usr/bin/env bash
set -euo pipefail

# 比對 repo 內的 Agent/command 定義與全域入口的「語意契約」。
# 全域入口刻意是薄指標，不應與 repo 的完整 Agent 定義做逐字 diff。
# 本腳本只讀取與回報，不會覆寫任何全域檔案。

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
global_home="${PRESENTATION_MANAGER_GLOBAL_HOME:-$HOME}"

repo_agent="$root/.claude/agents/presentation-manager.md"
repo_command="$root/.claude/commands/presentation-manager.md"
global_agent="$global_home/.claude/agents/presentation-manager.md"
global_command="$global_home/.claude/commands/presentation-manager.md"
codex_toml="$global_home/.codex/agents/presentation-manager.toml"

synced_count=0
out_of_sync_count=0
not_installed_count=0

report_missing() {
  local file="$1"
  shift
  local pattern
  for pattern in "$@"; do
    if ! grep -Fq -- "$pattern" "$file"; then
      printf '  - 缺少：%s\n' "$pattern"
    fi
  done
}

compare_entry() {
  local name="$1"
  local file="$2"
  shift 2

  if [ ! -f "$file" ]; then
    printf 'NOT_INSTALLED: %s\n' "$name"
    printf '  - 找不到：%s\n' "$file"
    not_installed_count=$((not_installed_count + 1))
    return
  fi

  local missing_file
  missing_file="$(mktemp "${TMPDIR:-/tmp}/presentation-sync-missing.XXXXXX")"
  report_missing "$file" "$@" > "$missing_file"

  if [ ! -s "$missing_file" ]; then
    printf 'SYNCED: %s\n' "$name"
    synced_count=$((synced_count + 1))
  else
    printf 'OUT_OF_SYNC: %s\n' "$name"
    cat "$missing_file"
    out_of_sync_count=$((out_of_sync_count + 1))
  fi
  /bin/rm -f -- "$missing_file"
}

if [ ! -f "$repo_agent" ] || [ ! -f "$repo_command" ]; then
  printf 'FAIL: 找不到 repo 內的 presentation-manager SSOT 或 command\n' >&2
  exit 1
fi

printf '%s\n' '=== 1. Claude Agent 全域入口 ==='
compare_entry \
  'presentation-manager-agent' \
  "$global_agent" \
  '正式規格唯一來源' \
  'presentation-manager.md' \
  '輸出路徑' \
  'ppt-master'

printf '%s\n' '' '=== 2. Claude command 全域入口 ==='
compare_entry \
  'presentation-manager-command' \
  "$global_command" \
  '正式規格唯一來源' \
  'presentation-manager.md' \
  '輸出路徑' \
  'ppt-master'

printf '%s\n' '' '=== 3. Codex Agent 全域入口 ==='
compare_entry \
  'codex-agent' \
  "$codex_toml" \
  'name = "presentation-manager"' \
  'ppt-master' \
  '輸出路徑' \
  '中繼 Markdown' \
  '本機'

printf '%s\n' '' '=== 總結 ==='
printf '%d SYNCED, %d OUT_OF_SYNC, %d NOT_INSTALLED\n' \
  "$synced_count" "$out_of_sync_count" "$not_installed_count"

if [ "$out_of_sync_count" -gt 0 ] || [ "$not_installed_count" -gt 0 ]; then
  printf '%s\n' '' '請 review 缺少的契約內容，再手動同步全域入口。' \
    '本腳本不會自動覆寫任何檔案。'
  exit 1
fi
