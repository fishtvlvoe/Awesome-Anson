---
name: pm-discovery-upgrade
description: "在 PM 需求轉譯前加入一題一題的前期調查，產出可交給報價流程的確認資料包"
disable-model-invocation: true
license: MIT
---

# PM 前期調查升級

這是 `/pm` 的前置升級提案，不取代既有「場景引導 → AI 轉譯 → 雛形分析 → FRD」四步驟。它把 `grill-me` 的單題訪談方式與 `grill-with-docs` 的決策留痕概念接到 PM 前面。

## 使用時機

客戶需求模糊、專案跨多個第三方服務、需要估價，或功能與程式碼／授權邊界可能影響價格時使用。簡單且資料完整的案件可跳過。

判斷案件複雜度、設計檢查點頻率、規劃提案會議節奏時，參考 `knowledge/project-control-principles.md`。

## 執行規則

1. 先讀逐字稿、既有 Demo、專案規則與現有文件；能查證的問題不問使用者。
2. 一次只問一個最關鍵問題，提供建議答案、理由與不確認的影響。
3. 每個決定標記 `confirmed`、`pending` 或 `inferred`。
4. 術語定義寫入 glossary；不可逆且會影響方案的決策才提議寫 ADR。
5. 完成前輸出 PM-to-Quote Data Pack，交給 `engagement-quote`。

## 停止點

訪談摘要、範圍分類、資料包都必須停下來讓使用者確認；沒有確認不能進入正式估價或正式 FRD 定稿。

## 交付欄位

至少交付：目標、角色、流程、必要／非必要／未知範圍、第三方整合、部署責任、程式碼／授權邊界、成功標準、風險、待確認問題與決策紀錄。格式契約見 `contracts/PM-TO-QUOTE-DATA-PACK.md`。

## 品質檢查與完成條件

- [ ] 已先讀取可用的逐字稿、Demo 與專案文件。
- [ ] 每次只問一題，且已提供建議答案與影響。
- [ ] 所有欄位都有 `confirmed`、`pending` 或 `inferred` 狀態。
- [ ] PM-to-Quote Data Pack 已經使用者確認。
- [ ] 未把推測內容當成客戶承諾或正式價格。
