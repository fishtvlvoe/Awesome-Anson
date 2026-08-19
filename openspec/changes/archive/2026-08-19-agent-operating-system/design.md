# Agent 工作系統設計

## 目標流程

```text
/client-quote 案件路徑
  ↓
Project Manager Agent
  ├─ 讀取既有資料
  ├─ 複雜案件 → grill-with-docs
  └─ FRD + CONTEXT + ADR
  ↓ 使用者確認
PM-to-Quote Data Pack
  ↓ 使用者確認
Commercial Proposal & Quotation Specialist
  ├─ 必要／非必要／加購拆價
  ├─ HTML 草稿
  └─ PDF + 驗證
```

## Decisions

### Decision 1：兩個 Agent 分工，不合併成單一 Agent

**Alternatives Considered**

1. 一個 Agent 同時做 PM 與報價：否決，需求理解與商務承諾混在一起，停止點不清楚。
2. 三個以上專業 Agent：否決，初期交接成本太高，兩個角色已涵蓋主要工作。

採用兩個角色，透過固定 Data Pack 交接；未來若需要總控，使用 command 作為流程入口，不新增第三個專業角色。

### Decision 2：案件資料是跨對話記憶的 SSOT

**Alternatives Considered**

1. 依賴對話歷史：否決，容易遺漏且無法跨 Agent 穩定讀取。
2. 依賴全域 Agent memory：否決，客戶資料與案件狀態不應混在機器全域記憶。

採用案件資料夾、CONTEXT、ADR 與 PM-to-Quote Data Pack。

## Risks / Trade-offs

- [Risk] 使用者期待完全自動承諾價格 → Mitigation：每個 Agent 明確保留需求、價格與文件停止點。
- [Risk] 全域 Skill 版本更新造成行為差異 → Mitigation：在 README 記錄依賴名稱，執行前檢查 SSOT 是否存在。
- [Risk] 案件資料夾保存敏感資料 → Mitigation：模板不含真實個資，並禁止 API key、密碼與帳號進 Git。

## Open Questions

- 未來是否要為 `/client-quote` 建立自動產生案件資料夾的腳本；本 SR 先提供模板與流程，不新增不必要依賴。
