# PM專案師

這是 Fish 的接案代理工作區，集中管理可重複使用的 Agent 身份、Skills 依賴、案件資料契約與流程入口。與 `agentOS`（案子狀態追蹤 CLI）為不同專案，兩者不互相依賴。

## 三個核心 Agent

```text
Project Manager Agent
專案管理與需求分析師
  ↓ PM-to-Quote Data Pack
Commercial Proposal & Quotation Specialist
商務提案與報價顧問
  ↓ 簡報需求或已確認的提案內容
Presentation Manager
簡報管理師
```

## 使用入口

```text
/client-quote <案件資料夾或逐字稿路徑>
```

總入口會先執行需求分析；複雜案件先使用 `grill-with-docs`，確認後才產出 FRD 與報價資料包，再交給商務提案與報價 Agent。

若要把已確認的內容整理成簡報，可使用：

```text
/presentation-manager <文案、報價單、PRD 或課程資料>
```

簡報管理師產出已確認的簡報中繼 Markdown 後，支援雙輸出路徑，由使用者明確選擇：

- **Kimi 路徑**：使用全域 `kimi-slide` Skill，產出可貼給 Kimi PPT 的提詞。不自動呼叫 Kimi API、不自動貼上，也不宣稱已產出 HTML／PDF 檔案。
- **本機 ppt-master 路徑**：產出 `PRESENTATION-HANDOFF-PACK.md` 定義的交接包（中繼 Markdown + metadata + 製作指引），交給本機 ppt-master repo（`/Users/fishtv/Development/ppt-master`）執行製作。簡報管理師**不執行** ppt-master、不產出 `.pptx`，`.pptx` 的產出與驗證由 ppt-master 執行環境負責。

兩條路徑皆以使用者確認過的中繼 Markdown 為唯一內容來源，不得從原始輸入另起爐灶。

## 依賴 Skills

由全域 SSOT 提供，不在本 repo 複製內容：

- `pm-discovery-upgrade`
- `grill-with-docs`
- `grilling`
- `domain-modeling`
- `engagement-quote`
- `pdf`
- `speak-human-tw`
- `kimi-slide`

依賴與交接規格：

- [PM-TO-QUOTE-DATA-PACK.md](contracts/PM-TO-QUOTE-DATA-PACK.md)：PM Agent → 商務提案與報價 Agent
- [PRESENTATION-HANDOFF-PACK.md](contracts/PRESENTATION-HANDOFF-PACK.md)：簡報管理師 → ppt-master 交接包
