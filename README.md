# 案神 CaseGenie（原 PM專案師）

**這不是常駐系統，不是 Agent OS。** 沒有背景排程、沒有狀態機一直在跑——你打指令或呼叫 Agent 它才動，不叫它就完全靜止，像精靈一樣呼之即來、揮之即去。它是一組「丟案件資料進去、吐結構化產出出來」的接案分析架構：集中管理可重複使用的 Agent 身份、Skills 依賴、案件資料契約與流程入口。

## 這個 repo 裝了什麼，別人裝了會拿到什麼

`.claude/agents/` 三個 Agent 身份 ＋ `.claude/skills/` 七個實際可用的 Skill（不是外部連結，檔案本身就在這個 repo 裡）＋ 契約文件。clone 下來就是一整套，不用另外去別的地方湊依賴。

## 安裝方式（任何 AI 工具都能裝，不限 Claude Code）

1. 把這個 repo clone 下來：
   ```
   git clone https://github.com/fishtvlvoe/agent.git 案神
   ```
2. 打開你在用的 AI 工具（Claude Code、Cursor、Codex CLI、Windsurf、或任何能讀檔案、能連續對話執行多步驟的 AI 都可以），把它指到剛剛 clone 下來的資料夾
3. 跟 AI 說：**「幫我安裝這個」**（或更明確一點：「讀這個資料夾的 README.md，還有 `.claude/agents/` 底下三個角色的說明，之後我提到報價、簡報、需求分析，就照這些角色的規則做」）
4. AI 自己讀完就會知道怎麼扮演這三個角色，不用你手動搬檔案或設定

**差異**：Claude Code 認得 `.claude/agents/*.md` 和 `.claude/commands/*.md` 這套格式，會自動抓到，`/client-quote` 這種指令也是原生支援，裝好立刻能打；其他 AI 工具沒有這種「自動認格式」的機制，需要你明確叫它先讀過 README 跟 Agent 說明檔，之後用口語描述（「用 PM 助理幫我分析這份逐字稿」）達到一樣效果，不能打 `/client-quote` 這種斜線指令。

## 新手怎麼用（不懂技術也看得懂，以 Claude Code 為例）

**這是做什麼的**：接案子時，把客戶給的一堆資料（逐字稿、會議記錄、官網連結）丟進來，它會像三個助理接力，幫你整理成「需求」、「報價單」、「簡報」。

**照這幾步做：**

1. 打開 Claude Code，進到這個資料夾
2. 把客戶給的資料準備好：逐字稿檔案路徑、資料夾位置都可以
3. 打這一行，把 `<>` 換成你的檔案路徑：
   ```
   /client-quote <案件資料夾或逐字稿路徑>
   ```
4. 它會開始一題一題問你問題（一次只問一題，你答完才問下一題），照實回答就好
5. 它整理完需求會先給你看一份摘要，你要說「對」或「這裡改一下」，它才會往下算報價
6. 報價確認完，如果還要做簡報，直接用中文跟它說「幫我做成簡報」，它自己知道要叫哪個助理，不用背指令

**你不用做的事**：不用自己套報價公式、不用自己排簡報版面、它不會自己把東西送給客戶——每一步都會先給你看、等你點頭才繼續。

## 三個核心 Agent（接力賽，不是同一個東西）

```text
Project Manager Agent（project-manager）
專案管理與需求分析師：讀逐字稿/資料 → 拆需求 → 分類 confirmed/pending/inferred
  ↓ PM-to-Quote Data Pack（contracts/PM-TO-QUOTE-DATA-PACK.md）
Commercial Proposal & Quotation Specialist
商務提案與報價顧問：算價格、寫條款 → HTML/PDF 報價
  ↓ 已確認的提案內容或簡報需求
Presentation Manager（簡報師）
簡報管理師：整理成逐頁結構 → Kimi 提詞 或 ppt-master 交接包
```

每個 Agent 各自獨立，沒有互相知道對方狀態；上一棒的「已確認」產出，是下一棒唯一的輸入來源。

## 怎麼叫（兩種方式，看情境）

**整案分析到報價，一條龍走完：**

```text
/client-quote <案件資料夾或逐字稿路徑>
```

這個指令會依序帶你走 project-manager → commercial-proposal-quotation-specialist：先需求分析（複雜案件先跑 `grill-with-docs`），FRD 確認後才進報價，報價與 HTML 初稿確認後才出 PDF。中間每一步都停下來等你確認，不會自己往下衝。

**只要用某一個 Agent（不透過 /client-quote）：**

沒有對應 slash command，直接用 Agent 工具點名呼叫：

```text
Agent(subagent_type="project-manager", ...)
Agent(subagent_type="commercial-proposal-quotation-specialist", ...)
Agent(subagent_type="簡報師", ...)
```

例如只想重新做一份簡報、不想重跑整個 PM 流程，就直接叫 `簡報師`，把已確認的文案/報價單/PRD 丟給它。

> 舊版曾經有 `/presentation-manager` 這個 slash command，內容跟「簡報師」Agent 定義重複又會不同步，已移除。簡報功能現在只有一個入口：Agent 呼叫「簡報師」。

簡報管理師產出已確認的簡報中繼 Markdown 後，支援雙輸出路徑，由使用者明確選擇：

- **Kimi 路徑**：使用本 repo 內建的 `kimi-slide` Skill，產出可貼給 Kimi PPT 的提詞。不自動呼叫 Kimi API、不自動貼上，也不宣稱已產出 HTML／PDF 檔案。
- **本機 ppt-master 路徑**：產出 `PRESENTATION-HANDOFF-PACK.md` 定義的交接包（中繼 Markdown + metadata + 製作指引），交給本機 ppt-master repo（`/Users/fishtv/Development/ppt-master`）執行製作。簡報管理師**不執行** ppt-master、不產出 `.pptx`，`.pptx` 的產出與驗證由 ppt-master 執行環境負責。

兩條路徑皆以使用者確認過的中繼 Markdown 為唯一內容來源，不得從原始輸入另起爐灶。

## 依賴 Skills

全部實體檔案都在本 repo 的 `.claude/skills/` 底下，clone 下來就有，不需要另外去全域環境裝：

- `pm-discovery-upgrade`、`engagement-quote`、`kimi-slide` — 自己寫的
- `grill-with-docs`、`grilling`、`domain-modeling` — 原樣搬自 [mattpocock/skills](https://github.com/mattpocock/skills)（MIT）
- `im-human` — 原樣搬自 [chang416/im-human](https://github.com/chang416/im-human)（MIT，取代舊引用的 `speak-human-tw`）

授權與出處明細見 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

依賴與交接規格：

- [PM-TO-QUOTE-DATA-PACK.md](contracts/PM-TO-QUOTE-DATA-PACK.md)：PM Agent → 商務提案與報價 Agent
- [PRESENTATION-HANDOFF-PACK.md](contracts/PRESENTATION-HANDOFF-PACK.md)：簡報管理師 → ppt-master 交接包
