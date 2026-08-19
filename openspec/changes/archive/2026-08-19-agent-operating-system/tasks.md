## 1. Workspace and dependencies

- [x] 1.1 [Tool: codex] 建立 Agent repo、Git 與 Spectra 結構，對應 Requirement: The workspace SHALL provide two distinct Agent identities
- [x] 1.2 [Tool: codex] 確認全域 Skills 依賴存在，對應 Requirement: The workspace SHALL define a stable PM-to-Quote handoff

## 2. Agent identities

- [x] 2.1 [Tool: sonnet] 建立 Project Manager Agent，對應 Requirement: The workspace SHALL provide two distinct Agent identities；遵守 Decision 1：兩個 Agent 分工，不合併成單一 Agent
- [x] 2.2 [Tool: sonnet] 建立 Commercial Proposal & Quotation Specialist，對應 Requirement: The workspace SHALL provide two distinct Agent identities；遵守 Decision 1：兩個 Agent 分工，不合併成單一 Agent

## 3. Handoff and entry point

- [x] 3.1 [Tool: codex] 建立 PM-to-Quote Data Pack 契約與 YAML 模板，對應 Requirement: The workspace SHALL define a stable PM-to-Quote handoff；遵守 Decision 2：案件資料是跨對話記憶的 SSOT
- [x] 3.2 [Tool: sonnet] 建立 `/client-quote` 總入口，對應 Requirement: The client-quote command SHALL preserve human confirmation gates
- [x] 3.3 [Tool: codex] 建立敏感資料與案件資料夾規則，對應 Requirement: The workspace SHALL protect client data；遵守 Decision 2：案件資料是跨對話記憶的 SSOT

## 4. 驗證與交付

- [x] 4.1 [Tool: codex] 執行 `spectra analyze agent-operating-system --json`
- [x] 4.2 [Tool: codex] 執行 `spectra validate agent-operating-system`
- [x] 4.3 [Tool: codex] 執行 Agent 結構、依賴與 Data Pack smoke test
- [x] 4.4 [Tool: codex] 向 Fish 展示兩個 Agent 與總入口，確認後 commit 與推送
