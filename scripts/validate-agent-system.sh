#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }

# 全域 Skill 可能安裝在多個位置，依序搜尋，找到任一個即算通過。
# 測試可用冒號分隔的 PRESENTATION_MANAGER_SKILL_ROOTS 注入隔離 root。
if [ -n "${PRESENTATION_MANAGER_SKILL_ROOTS:-}" ]; then
  IFS=: read -r -a SKILL_ROOTS <<< "$PRESENTATION_MANAGER_SKILL_ROOTS"
else
  SKILL_ROOTS=(
    "$HOME/.mirasim/skills"
    "$HOME/.claude/skills"
    "$HOME/Development/.skills-ssot/live"
  )
fi

# resolve_skill <skill-name>
# 遍歷 SKILL_ROOTS 尋找 <root>/<name>/SKILL.md。
# 找到 → 印出命中路徑、回傳 0（PASS）。
# 全找不到 → 印出已搜尋的 roots 清單、回傳 1（FAIL），由呼叫端決定是否 fail。
resolve_skill() {
  local name="$1" root_path
  for root_path in "${SKILL_ROOTS[@]}"; do
    if [ -f "$root_path/$name/SKILL.md" ]; then
      printf '找到 %s: %s\n' "$name" "$root_path/$name/SKILL.md"
      return 0
    fi
  done
  printf '找不到 %s，已搜尋：\n' "$name" >&2
  for root_path in "${SKILL_ROOTS[@]}"; do
    printf '  - %s\n' "$root_path/$name/SKILL.md" >&2
  done
  return 1
}

for file in \
  "$root/.claude/agents/project-manager.md" \
  "$root/.claude/agents/commercial-proposal-quotation-specialist.md" \
  "$root/.claude/agents/presentation-manager.md" \
  "$root/.claude/commands/client-quote.md" \
  "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" \
  "$root/templates/quote-data-pack.yaml"; do
  [ -f "$file" ] || fail "找不到 $file"
done

for dependency in pm-discovery-upgrade grill-with-docs grilling domain-modeling engagement-quote speak-human-tw kimi-slide; do
  resolve_skill "$dependency" >/dev/null || fail "缺少全域 Skill：$dependency"
done

# PDF Skill 額外允許 Codex runtime cache 的任意版本路徑作為 fallback。
if ! resolve_skill pdf >/dev/null 2>&1; then
  pdf_skill_path=''
  for pdf_candidate in "$HOME/.codex/plugins/cache/openai-primary-runtime/pdf"/*/skills/pdf/SKILL.md; do
    if [ -f "$pdf_candidate" ]; then
      pdf_skill_path="$pdf_candidate"
      break
    fi
  done
  [ -n "$pdf_skill_path" ] || fail '缺少 PDF Skill'
  printf '找到 pdf: %s\n' "$pdf_skill_path"
fi

grep -q 'confirmed' "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" || fail '缺少 confirmed 狀態'
grep -q 'pending' "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" || fail '缺少 pending 狀態'
grep -q 'inferred' "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" || fail '缺少 inferred 狀態'
grep -q '/client-quote' "$root/.claude/commands/client-quote.md" || fail '缺少總入口'
grep -q 'grill-with-docs' "$root/.claude/agents/project-manager.md" || fail 'PM Agent 未接 grill'
grep -q 'engagement-quote' "$root/.claude/agents/commercial-proposal-quotation-specialist.md" || fail '報價 Agent 未接 engagement-quote'
grep -q 'kimi-slide' "$root/.claude/agents/presentation-manager.md" || fail '簡報管理師未接 kimi-slide'

# 簡報管理師專用檢查：雙輸出路徑（Kimi／本機 ppt-master）與保留原則、交接包契約。
grep -q 'ppt-master' "$root/.claude/agents/presentation-manager.md" \
  || fail '簡報管理師未定義 ppt-master 路徑'
grep -q '本機' "$root/.claude/agents/presentation-manager.md" \
  || fail '簡報管理師未定義本機輸出路徑'
grep -q '保留原則' "$root/.claude/agents/presentation-manager.md" \
  || fail '簡報管理師未定義保留原則'
grep -Eq '唯一內容來源|SSOT' "$root/.claude/agents/presentation-manager.md" \
  || fail '簡報管理師未定義中繼 Markdown 的唯一內容來源'
grep -q '輸出路徑' "$root/.claude/commands/presentation-manager.md" \
  || fail '簡報管理師入口未要求確認輸出路徑'
[ -f "$root/contracts/PRESENTATION-HANDOFF-PACK.md" ] \
  || fail "找不到 $root/contracts/PRESENTATION-HANDOFF-PACK.md"
grep -q 'python3' "$root/contracts/PRESENTATION-HANDOFF-PACK.md" \
  || fail '交接包契約缺少 .pptx 可讀性驗證'
grep -q 'pptx_delivery_check.py' "$root/contracts/PRESENTATION-HANDOFF-PACK.md" \
  || fail '交接包契約未接 ppt-master delivery checker'

printf 'PASS: Agent 身份、總入口、資料契約與全域 Skill 依賴\n'
