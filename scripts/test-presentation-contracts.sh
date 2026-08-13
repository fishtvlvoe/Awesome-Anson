#!/usr/bin/env bash
set -euo pipefail

# targeted contract tests：驗證 presentation-manager 的修正是否到位。
# 每項獨立判斷 pass/fail，不因單項失敗中斷整體測試（TDD 紅燈期間應允許看到全貌）。

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

AGENT_FILE="$root/.claude/agents/presentation-manager.md"
COMMAND_FILE="$root/.claude/commands/presentation-manager.md"
HANDOFF_CONTRACT="$root/contracts/PRESENTATION-HANDOFF-PACK.md"
VALIDATOR_SCRIPT="$root/scripts/validate-agent-system.sh"
SYNC_SCRIPT="$root/scripts/sync-global-entries.sh"

pass_count=0
fail_count=0

# check <編號> <說明> <條件命令...>
# 條件命令回傳 0 視為 pass，非 0 視為 fail；不使用 set -e 直接讓腳本中止。
check() {
  local id="$1" desc="$2"
  shift 2
  if "$@" >/dev/null 2>&1; then
    printf 'PASS %s: %s\n' "$id" "$desc"
    pass_count=$((pass_count + 1))
  else
    printf 'FAIL %s: %s\n' "$id" "$desc"
    fail_count=$((fail_count + 1))
  fi
}

# 1. Agent 定義包含兩條輸出路徑
check 1 'Agent 定義包含 Kimi 與 ppt-master 雙路徑' \
  bash -c "grep -q 'Kimi' '$AGENT_FILE' && grep -q 'ppt-master' '$AGENT_FILE'"

# 2. Agent 定義包含所有必要閘門
check 2 'Agent 定義包含 Path 判斷／中繼 Markdown／輸出路徑閘門' \
  bash -c "grep -Eq 'Path.*判斷' '$AGENT_FILE' && grep -Eq '中繼.*Markdown' '$AGENT_FILE' && grep -q '輸出路徑' '$AGENT_FILE'"

# 3. Agent 定義包含保留原則
check 3 'Agent 定義包含保留原則' \
  grep -q '保留原則' "$AGENT_FILE"

# 4. Agent 定義包含 SSOT 聲明
check 4 'Agent 定義包含唯一內容來源／SSOT 聲明' \
  bash -c "grep -q '唯一內容來源' '$AGENT_FILE' || grep -q 'SSOT' '$AGENT_FILE'"

# 5. 交接包契約存在且包含驗證條件
check 5 '交接包契約存在且包含驗證條件' \
  bash -c "[ -f '$HANDOFF_CONTRACT' ] && grep -q 'pptx_delivery_check.py' '$HANDOFF_CONTRACT' && grep -q 'Presentation' '$HANDOFF_CONTRACT'"

# 6. repo command 包含雙路徑
check 6 'repo command 包含 Kimi 與 ppt-master 雙路徑' \
  bash -c "grep -q 'Kimi' '$COMMAND_FILE' && grep -q 'ppt-master' '$COMMAND_FILE'"

# 7. Skill resolver 函式存在於 validator
check 7 'validator 內存在 resolve_skill 函式' \
  grep -q 'resolve_skill' "$VALIDATOR_SCRIPT"

# 8. validator 不再把 .skills-ssot/live 當成唯一硬編路徑
#    （SKILL_ROOTS 陣列允許 .skills-ssot/live 作為其中一個備援 root，
#      這裡驗證的是「舊版單一硬編寫死」的模式已消失，而非整串字樣完全不存在）
check 8 'validator 不再硬編 .skills-ssot/live 為唯一路徑' \
  bash -c "! grep -Eq 'Development/\.skills-ssot/live/\\\$dependency/SKILL\.md' '$VALIDATOR_SCRIPT'"

## 9-10. 用隔離的 Skill root 驗證 resolver 的 PASS／FAIL 行為，不依賴本機目前安裝了哪些 Skill。
mock_skill_root="$(mktemp -d "${TMPDIR:-/tmp}/presentation-contract-skills.XXXXXX")"
mock_sync_home="$(mktemp -d "${TMPDIR:-/tmp}/presentation-contract-home.XXXXXX")"
mock_sync_output="$(mktemp "${TMPDIR:-/tmp}/presentation-contract-sync.XXXXXX")"
cleanup() {
  /bin/rm -rf -- "$mock_skill_root" "$mock_sync_home" "$mock_sync_output"
}
trap cleanup EXIT

for dependency in pm-discovery-upgrade grill-with-docs grilling domain-modeling engagement-quote speak-human-tw kimi-slide pdf; do
  mkdir -p "$mock_skill_root/$dependency"
  : > "$mock_skill_root/$dependency/SKILL.md"
done

check 9 'validator 在替代 Skill root 找到所有依賴時通過' \
  env PRESENTATION_MANAGER_SKILL_ROOTS="$mock_skill_root" "$VALIDATOR_SCRIPT"

/bin/rm -f -- "$mock_skill_root/kimi-slide/SKILL.md"
if env PRESENTATION_MANAGER_SKILL_ROOTS="$mock_skill_root" "$VALIDATOR_SCRIPT" >/dev/null 2>&1; then
  printf 'FAIL 10: validator 缺少 Skill 時應回傳失敗\n'
  fail_count=$((fail_count + 1))
else
  printf 'PASS 10: validator 缺少 Skill 時回傳失敗\n'
  pass_count=$((pass_count + 1))
fi

## 11-12. 全域同步檢查使用隔離 HOME：先驗證同步，再驗證 stale command 會被擋下。
mkdir -p "$mock_sync_home/.claude/agents" "$mock_sync_home/.claude/commands" "$mock_sync_home/.codex/agents"
printf '%s\n' \
  '# global presentation manager entry' \
  '正式規格唯一來源：/Users/fishtv/Development/PM專案師/.claude/agents/presentation-manager.md' \
  '輸出路徑：Kimi 或本機 ppt-master 交接包' \
  'ppt-master' > "$mock_sync_home/.claude/agents/presentation-manager.md"
printf '%s\n' \
  '# /presentation-manager' \
  '正式規格唯一來源：/Users/fishtv/Development/PM專案師/.claude/agents/presentation-manager.md' \
  '使用者確認後選擇輸出路徑：Kimi 或本機 ppt-master 交接包' \
  'ppt-master' > "$mock_sync_home/.claude/commands/presentation-manager.md"
printf '%s\n' \
  'name = "presentation-manager"' \
  'description = "簡報管理師：交付 Kimi 提詞或原生簡報製作交接包"' \
  'developer_instructions = """' \
  '正式規格唯一來源：/Users/fishtv/Development/PM專案師/.claude/agents/presentation-manager.md' \
  '輸出路徑：Kimi 或本機 ppt-master 交接包' \
  '本機 ppt-master 交接包' \
  '中繼 Markdown' \
  '"""' > "$mock_sync_home/.codex/agents/presentation-manager.toml"

sync_status=0
PRESENTATION_MANAGER_GLOBAL_HOME="$mock_sync_home" "$SYNC_SCRIPT" >"$mock_sync_output" 2>&1 || sync_status=$?
if [ "$sync_status" -eq 0 ] && grep -q '3 SYNCED' "$mock_sync_output"; then
  printf 'PASS 11: 全域同步檢查在語意一致時通過\n'
  pass_count=$((pass_count + 1))
else
  printf 'FAIL 11: 全域同步檢查在語意一致時未通過\n'
  fail_count=$((fail_count + 1))
fi

printf '%s\n' '# stale command' > "$mock_sync_home/.claude/commands/presentation-manager.md"
sync_status=0
PRESENTATION_MANAGER_GLOBAL_HOME="$mock_sync_home" "$SYNC_SCRIPT" >"$mock_sync_output" 2>&1 || sync_status=$?
if [ "$sync_status" -ne 0 ] && grep -q 'OUT_OF_SYNC: presentation-manager-command' "$mock_sync_output"; then
  printf 'PASS 12: 全域同步檢查能抓到 stale command\n'
  pass_count=$((pass_count + 1))
else
  printf 'FAIL 12: 全域同步檢查未抓到 stale command\n'
  fail_count=$((fail_count + 1))
fi

printf -- '---\n'
printf '通過：%d／%d\n' "$pass_count" "$((pass_count + fail_count))"

if [ "$fail_count" -gt 0 ]; then
  printf '尚有 %d 項未通過。\n' "$fail_count" >&2
  exit 1
fi

printf 'PASS: presentation-manager contract tests 全數通過\n'
