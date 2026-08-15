# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `/spectra-*` skills when:

- A discussion needs structure before coding → `/spectra-discuss`
- User wants to plan, propose, or design a change → `/spectra-propose`
- Tasks are ready to implement → `/spectra-apply`
- There's an in-progress change to continue → `/spectra-ingest`
- User asks about specs or how something works → `/spectra-ask`
- Implementation is done → `/spectra-archive`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode → `ingest` → resume `apply`

# PM專案師

接案代理工作區。三個核心 Agent：Project Manager Agent（需求分析）→ Commercial Proposal & Quotation Specialist（報價）→ Presentation Manager（簡報）。詳見 `README.md`。

## 案件資料規則（不用使用者每次重講）

收到客戶前期調研資料（逐字稿、會議記錄、官網／社群連結、Brand Guideline 等）且尚未建案：

1. 依 `cases/README.md` 慣例，開 `cases/<client-slug>/docs/research/`
2. 原始資料先整份存進去，不摘要、不加工
3. 才進入 Project Manager Agent 的需求分析流程

`cases/*/` 已在 `.gitignore` 排除，不進版控（即使本 repo 是 private，也不把真實客戶資料留在 git 歷史裡）。

不建立 repo 根目錄 `docs/`——案件資料一律在 `cases/<client-slug>/` 底下，避免和既有 `cases/` 結構打架。

## 🔴 硬規則 — 一題一題問，禁止批次（2026-08-13）

任何 Agent（Project Manager Agent、Commercial Proposal & Quotation Specialist、Presentation Manager）向 Fish 提出需要決定的問題，一次只問一題，等回答才問下一題。

**禁止**：把多個待確認問題彙整成一份清單一次丟出（例：`OPEN-QUESTIONS.md` 列 5 題同時問）。就算 Fish 當下不在線上、要背景跑分析，也不可為了「省互動次數」把問題批次列出——先產出能自主完成的分析，剩下的問題排隊，一題一題問，Fish 之後用手機陸續回覆時逐題往下走。

派工／指示 subagent 執行案件分析時，prompt 裡不可指示 subagent「彙整問題一次問完」；必須明確要求「一題一題，用 AskUserQuestion 逐題確認」。

起因：2026-08-13 Vista IMC 案，派工 prompt 誤指示「收斂成 5 題一次問」，違反 `project-manager.md` 原本就寫的「一次只問一個」規格，被 Fish 糾正。

## 🔴 硬規則 — 案件資料必須讀原始檔案，不能只信對話摘要（2026-08-13）

使用者給的是檔案路徑（逐字稿、Demo、既有文件）時，必須直接 `Read` 該檔案的完整內容，不能只依賴使用者在對話裡貼的片段當作全部資料。對話貼的內容常常是使用者自己節錄的重點，不是原文全文，會漏掉關鍵細節（人數、組織編制、報價數字、時間安排等）。

起因：2026-08-13 Vista IMC 案，只存了 Fish 貼在對話框的逐字稿摘要，沒去讀 Fish 提供的原始 Obsidian 逐字稿路徑，導致漏掉客戶口述的「5人規模」等關鍵資訊，被 Fish 糾正後才回頭讀原始檔案補齊。

## 🔴 硬規則 — 多檔案讀取／結構化摘要必須派 Haiku，不在主對話自己讀（2026-08-13）

讀逐字稿全文、多份既有文件、做結構化摘要，屬於 `~/.claude/rules/routing.md` 定義的「3+ 檔案讀取 / 結構化摘要」類任務，一律派 Haiku 子代理處理，不可在主對話（不論當時是 Opus 或 Sonnet）自己用 Read/Bash grep 直接讀完再整理。

起因：2026-08-13 Vista IMC 案，主對話（Sonnet）自己用 Bash grep + Read 讀完整份逐字稿找人數資訊，被 Fish 指出違反自己訂的 routing.md，之後才改派 Haiku 子代理處理剩餘逐字稿掃描。
