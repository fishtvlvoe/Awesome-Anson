## Why

**案神是統籌者（CEO 角色），不是一條固定的線性流程。** 它手上有一組專家 agent（`網頁設計師`、`案例設計師`、`簡報師`、`project-manager`、`commercial-proposal-quotation-specialist`）跟一個獨立外部專案（`報價師`），案神的工作是依每個案件的實際狀況判斷「這次需要哪些人、什麼順序、要不要跳過」，不是每次都照同一套步驟走完。

現在的問題是：這個統籌關係從沒被寫下來。`demo-generation-deploy`（已封存能力）目前規格完全沒提網站風格、UI/UX、技術棧、簡報內容/風格、後台要做到多細——查證過 `design.md` 一個字都沒寫，只保證「能部署、有網址、能操作」。同時案神底下已經有專門處理這幾件事的 agent（`網頁設計師` 風格與 mockup、`案例設計師` 真實設計案例、`簡報師` 簡報內容），但沒有任何文件寫「案神什麼時候該叫誰」——`demo-generation-deploy` 從沒引用過它們，等於案神空有一組專家，卻沒有調度規則。

這個 change 要補的不是「demo-generation-deploy 該長什麼樣子」這一個小問題，是「案神身為統籌者，該怎麼判斷派工」這件事。

## What Changes

**核心原則**：案神是整個接案流程唯一的大腦與調度者。`網頁設計師`、`案例設計師`、`簡報師`、`demo-generation-deploy`、`case-page` 這些能力／agent 平常各自能被單獨呼叫，但在一個進行中的案件裡，**沒有案神的判斷跟派工，其他人不動**——不是它們自己決定「該我上場了」，是案神看完當下狀況才決定要不要叫、叫誰、叫幾個。

- `demo-generation-deploy` 新增「風格與內容前置階段」，在部署前，先委派：
  - **`網頁設計師`**：跑它既有 Phase 1（風格方向討論 → 參考 21st.dev/motionsites.ai/Pinterest/案例設計師 → `frontend-design` skill 把關 → 產出 HTML mockup → 使用者確認），但**只到 mockup 確認為止，不進它自己的 Phase 2 部署流程**——部署由 `demo-generation-deploy` 自己接手（因為要處理 D1 登入後台，`網頁設計師` 既有的 Codex sites-building/sites-hosting 部署路徑不處理這塊）
  - **`案例設計師`**：在 `網頁設計師` 抓風格方向那步，明確列入案例來源之一（不只 21st.dev/motionsites.ai/Pinterest 外部參考，也查 SaaSFrame 本地索引找真實截圖/Figma 案例）
  - **`簡報師`**：只有 Demo 內容包含敘事/簡報式頁面（例如產品故事、逐頁介紹）時才委派，走它既有的逐頁結構確認流程；純功能性操作型 Demo（例如純後台系統示範）不需要
- 明確定義後台深度的判斷依據：沿用 `demo-generation-deploy` 既有的「需要登入才 provision D1」規則不變，新增一條——後台功能範圍以「已確認需求資料包」裡明確列出的功能為準，不多做、不少做，不確定的功能點標「示意用」而非做出完整可運作的假功能
- 前台呈現方式：沿用 `網頁設計師` 產出並經使用者確認的 mockup，`demo-generation-deploy` 部署時不能自己再改風格

## Non-Goals

- 不改動 `demo-generation-deploy` 既有的部署機制本身（Cloudflare Pages、D1 provision 條件、缺素材自動生成、失敗保留舊版網址）
- 不改動 `網頁設計師` 自己的部署流程（Codex sites-building/sites-hosting），這條路徑保留給它自己獨立使用時走
- 不規定固定的統一視覺風格（例如「案神 Demo 一律用某種配色」）——風格仍是逐案討論決定，不是套模板

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `demo-generation-deploy`：新增「部署前必須先委派網頁設計師（含案例設計師案例來源）產出並確認 mockup，敘事型內容另委派簡報師」的前置階段，部署本身的行為不變

## Impact

- 修改：`.claude/skills/demo-generation-deploy/SKILL.md`（新增風格與內容前置階段的委派規則）
- 依賴既有：`~/.claude/agents/網頁設計師.md`、`~/.claude/agents/案例設計師.md`、`.claude/agents/簡報師.md`（皆不修改，只是被引用）

## 案神完整流程收尾（既有，本次只是把它畫進同一張圖，不新增規格）

`commercial-proposal-quotation-specialist` 確認報價後，依既有 `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 送出指令給「報價師」（quote-master，獨立專案）：`client_id`／`confirmed_price`／`terms`／`case_ref`，一律已確認狀態才送出，不帶草稿標記。報價師收到指令後內部怎麼運作，完全是它自己專案的範圍，這份 change 不涉及、不修改。
