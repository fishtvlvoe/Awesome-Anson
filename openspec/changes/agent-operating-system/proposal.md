# 建立專案管理與商務報價 Agent 工作系統

## Why

目前 PM、grill、報價與 PDF 能力分散在不同 Skill 與 repository，使用者需要重複說明案件背景，也缺少固定的 Agent 身份與交接格式。

## What Changes

- 新增 Project Manager Agent，負責需求調查、grill 分流、FRD 與決策留痕。
- 新增 Commercial Proposal & Quotation Specialist，負責價格、提案、HTML/PDF 與驗證。
- 新增 PM-to-Quote Data Pack 契約與 YAML 模板。
- 新增 `/client-quote` 總入口，串接兩個 Agent 的停止點。
- 集中記錄全域 Skills 依賴，但不複製 Skill SSOT 內容。

## Non-Goals

- 不讓 Agent 自動確認價格、合約或客戶商務承諾。
- 不把兩個 Agent 合併成一個模糊職責的超級 Agent。
- 不把全域 Skills 複製到本 repo。
- 不保存真實客戶密碼、API key 或未授權商務資料。

## Impact

- 新增 `.claude/agents/`、`.claude/commands/`、`contracts/`、`templates/`。
- 依賴全域 `pm-discovery-upgrade`、`grill-with-docs`、`engagement-quote`、`pdf` 與 `speak-human-tw`。
