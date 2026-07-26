#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }

for file in \
  "$root/.claude/agents/project-manager.md" \
  "$root/.claude/agents/commercial-proposal-quotation-specialist.md" \
  "$root/.claude/commands/client-quote.md" \
  "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" \
  "$root/templates/quote-data-pack.yaml"; do
  [ -f "$file" ] || fail "找不到 $file"
done

for dependency in pm-discovery-upgrade grill-with-docs grilling domain-modeling engagement-quote speak-human-tw; do
  [ -f "/Users/fishtv/Development/.skills-ssot/live/$dependency/SKILL.md" ] || fail "缺少全域 Skill：$dependency"
done
[ -f "/Users/fishtv/Development/.skills-ssot/live/pdf/SKILL.md" ] || [ -f "/Users/fishtv/.codex/plugins/cache/openai-primary-runtime/pdf/26.723.12215/skills/pdf/SKILL.md" ] || fail '缺少 PDF Skill'

grep -q 'confirmed' "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" || fail '缺少 confirmed 狀態'
grep -q 'pending' "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" || fail '缺少 pending 狀態'
grep -q 'inferred' "$root/contracts/PM-TO-QUOTE-DATA-PACK.md" || fail '缺少 inferred 狀態'
grep -q '/client-quote' "$root/.claude/commands/client-quote.md" || fail '缺少總入口'
grep -q 'grill-with-docs' "$root/.claude/agents/project-manager.md" || fail 'PM Agent 未接 grill'
grep -q 'engagement-quote' "$root/.claude/agents/commercial-proposal-quotation-specialist.md" || fail '報價 Agent 未接 engagement-quote'

printf 'PASS: Agent 身份、總入口、資料契約與全域 Skill 依賴\n'
