# Agent Operating System

這是 Fish 的 Agent 代理工作區，集中管理可重複使用的 Agent 身份、Skills 依賴、案件資料契約與流程入口。

## 兩個核心 Agent

```text
Project Manager Agent
專案管理與需求分析師
  ↓ PM-to-Quote Data Pack
Commercial Proposal & Quotation Specialist
商務提案與報價顧問
```

## 使用入口

```text
/client-quote <案件資料夾或逐字稿路徑>
```

總入口會先執行需求分析；複雜案件先使用 `grill-with-docs`，確認後才產出 FRD 與報價資料包，再交給商務提案與報價 Agent。

## 依賴 Skills

由全域 SSOT 提供，不在本 repo 複製內容：

- `pm-discovery-upgrade`
- `grill-with-docs`
- `grilling`
- `domain-modeling`
- `engagement-quote`
- `pdf`
- `speak-human-tw`

依賴與交接規格見 [PM-TO-QUOTE-DATA-PACK.md](contracts/PM-TO-QUOTE-DATA-PACK.md)。
