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
