## Context

案神（`project-manager` + `commercial-proposal-quotation-specialist` 主導的整套接案流程）手上有一組專家能力：`網頁設計師`、`案例設計師`、`簡報師`（agent）、`demo-generation-deploy`、`case-page`（skill），加上一個獨立外部專案「報價師」（quote-master）。這些能力目前都各自能被單獨呼叫，但沒有任何文件寫「案神在什麼情況下該叫誰、叫幾個、跳過誰」——`demo-generation-deploy` 從沒引用過 `網頁設計師`／`案例設計師`／`簡報師`，等於案神空有一組專家卻沒有調度規則，也讓 `demo-generation-deploy` 自己承擔了它不擅長的風格判斷。

## Goals / Non-Goals

**Goals:**

- 明確定義案神身為統籌者的調度原則：其他 agent／skill 不自己決定何時上場，一律由案神判斷後派工
- 定義 `demo-generation-deploy` 部署前，什麼情況要委派 `網頁設計師`（含 `案例設計師` 案例來源）、什麼情況要委派 `簡報師`
- 把案神到報價師的既有交接（`contracts/ANSON-TO-QUOTEMASTER-COMMAND.md`）畫進同一張調度圖，讓整個流程的起訖點清楚

**Non-Goals:**

- 不改動任何被調度 agent 自己內部的流程（`網頁設計師` 的 Phase 1/2、`案例設計師` 怎麼查 SaaSFrame、`簡報師` 怎麼定稿）
- 不改動 `demo-generation-deploy` 既有的部署機制本身（Cloudflare Pages、D1 provision 條件、缺素材自動生成、失敗保留舊版網址）
- 不改動報價師交接契約的欄位形狀，也不涉及報價師內部怎麼運作
- 不規定固定統一視覺風格，風格仍逐案討論決定

## Decisions

### 案神是唯一調度者，其他能力不自主觸發

**選擇**：`網頁設計師`、`案例設計師`、`簡報師`、`demo-generation-deploy`、`case-page` 平常都是 `user-invocable` 的獨立能力，可以被直接呼叫。但在一個進行中的接案案件裡，這些能力的呼叫時機由案神（目前實際上是驅動整個對話的 Claude Code session）依當下案件狀態判斷，不是任一能力自己決定「該我了」。這條原則寫進 `demo-generation-deploy` SKILL.md 的開頭，作為後續步驟的前提。

**替代方案考慮過**：讓 `demo-generation-deploy` 自己內建判斷邏輯決定要不要呼叫 `網頁設計師`——放棄，因為那樣風格判斷的決策權跑到一個部署工具身上，不是案神在統籌，違反「案神是大腦」這個核心原則。

### Demo 部署前的委派順序：先風格，才部署

**選擇**：`demo-generation-deploy` 被呼叫時，案神先判斷這次 Demo 需不需要視覺風格產出（絕大多數情況都需要，因為是給客戶看的東西）：

1. **需要視覺呈現**（預設）→ 案神委派 `網頁設計師`，走它既有 Phase 1（風格方向討論 → 參考 21st.dev/motionsites.ai/Pinterest **加上 `案例設計師` 查 SaaSFrame 本地索引找真實案例** → `frontend-design` skill 把關 → 產出 HTML mockup → 使用者確認），**只到 mockup 確認為止，不進 `網頁設計師` 自己的 Phase 2 部署流程**——因為 Demo 需要 D1 登入後台，`網頁設計師` 既有的 Codex sites-building/sites-hosting 部署路徑不處理這塊，部署改由 `demo-generation-deploy` 自己接手
2. **內容包含敘事/簡報式頁面**（例如產品故事、逐頁介紹，不是每次都有）→ 額外委派 `簡報師`，走它既有的逐頁結構確認流程，產出的內容文案交給 `網頁設計師` 併入 mockup
3. 兩者都確認後，`demo-generation-deploy` 才拿著確認過的 mockup + 內容進部署，**部署階段不能自己再改風格**

**替代方案考慮過**：`demo-generation-deploy` 自己生成風格（目前現況）——放棄，這是本次要修的問題本身，會落入 AI 制式模板風險，且重複造輪子（`網頁設計師` 已有完整的抓風格＋防制式模板機制）。

### 後台深度與前台呈現的判斷依據

**選擇**：後台功能範圍以「已確認需求資料包」（`realtime-need-capture` 產出）裡明確列出的功能為準，不多做、不少做；資料包沒明講的功能點一律標「示意用」而非做出完整可運作的假功能。前台呈現方式沿用 `網頁設計師` 產出並經使用者確認的 mockup。

### 報價師交接維持既有契約，不擴大範圍

**選擇**：`commercial-proposal-quotation-specialist` 確認報價後，依既有 `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 送出指令（`client_id`／`confirmed_price`／`terms`／`case_ref`），一律已確認狀態才送出。這份契約已經完整定義，本次只是把它畫進案神完整流程圖裡，不修改契約本身、不涉及報價師內部怎麼運作。

## Implementation Contract

**行為**：Demo 生成流程呼叫 `demo-generation-deploy` 時，若判斷需要視覺風格產出，SKILL.md 明確要求先委派 `網頁設計師`（含 `案例設計師` 案例來源）產出並經使用者確認的 mockup，敘事型內容另委派 `簡報師`，兩者都確認後才進部署階段。

**介面／資料形狀**：
- `.claude/skills/demo-generation-deploy/SKILL.md` 新增「風格與內容前置階段」段落，明列委派對象（`網頁設計師`／`案例設計師`／`簡報師`）與各自的委派條件、停止點
- 不新增任何程式碼層的資料格式——委派本身透過 Agent 工具呼叫既有 agent，用它們既有的輸出（確認過的 HTML mockup 檔案路徑、簡報逐頁結構）作為輸入傳給部署階段
- `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 不變

**失敗模式**：
- `網頁設計師` mockup 未經使用者確認 → 沿用它既有的「強制停止點」，`demo-generation-deploy` 不得繼續進部署階段
- 案件判斷不需要視覺風格產出的極少數情況（例如客戶只要看純資料/純文字型 Demo）→ 案神可以判斷跳過 `網頁設計師`，但要在回報裡明講「這次跳過風格委派，因為 X」，不能悄悄跳過不說明

**驗收標準**：
- 走一次完整流程：從已確認需求資料包開始，觸發 Demo 生成，確認 `網頁設計師` 有被委派且產出 mockup、案例設計師有被引用為案例來源之一、使用者確認 mockup 後才進入部署
- 檢查 `.claude/skills/demo-generation-deploy/SKILL.md` 內容明確包含委派規則文字，且沒有跟 `網頁設計師`／`案例設計師`／`簡報師` 各自 SKILL/agent 檔案裡的既有規則衝突（例如重複定義風格判斷邏輯）

**範圍邊界**：這個 change 只定義「案神什麼時候該委派誰」跟「委派到哪裡為止」，不改動任何被委派 agent 自己內部怎麼做事，不改動 `demo-generation-deploy` 的部署機制本身，不改動報價師交接契約。

## Risks / Trade-offs

- [風險] 多一層委派會拉長 Demo 產出時間（原本可能幾分鐘直接部署，現在要先跑完 `網頁設計師` 的風格討論＋mockup 確認）→ 緩解：這是刻意的取捨，風格產出品質換取時間成本被視為必要，且 `網頁設計師` 本身已有效率化的既有流程（21st.dev/motionsites.ai 起手不是從零設計）
- [風險]「案神判斷跳過風格委派」這個例外沒有嚴格的判斷標準，可能被濫用當作省事捷徑 → 緩解：Implementation Contract 已明定跳過時必須在回報裡明講理由，留下可追溯紀錄
