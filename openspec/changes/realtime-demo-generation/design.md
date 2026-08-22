## Context

案神目前的流程是純粹「事後分析」：project-manager 讀逐字稿拆需求、commercial-proposal-quotation-specialist 算報價、簡報師或 case-page 產出靜態成果。整套流程沒有任何一步是「即時」的，也沒有任何一步會把東西部署到網路上。

現在要在對談當下加入即時拆解與即時 Demo，勢必碰到兩個既有邊界：
1. `case-page` skill 明文寫死「不部署上網（GitHub Pages、Cloudflare Pages 都不是這個 skill 的工作）」
2. 案神整個 repo 的自我定位是「不是常駐系統，沒有背景排程」（README 開頭第一句）

這兩條既有原則都不能被這次新增的功能打破，設計上要讓新能力繞開它們而不是跟它們打架。

## Goals / Non-Goals

**Goals:**

- 對談進行中，即時把語音轉成文字並拆解出需求（人群/場景/痛點/需求/解決方案，或服務型任務的 4×4 拆解）
- 對談結束前，能把已確認的需求轉成一個客戶當場可操作的 Demo，部署到 Cloudflare Pages，含 Cloudflare D1 後台登入
- Demo 內能嵌入第三方服務（如 LINE OA）的即時示意畫面
- Demo 缺圖/缺影片時能自動生成示意素材頂上
- 新增的部署行為完全獨立於 `case-page`，`case-page` 的「不部署」規則維持原樣

**Non-Goals:**

- 不做動態定價、催單通知（14 天倒數、漲價曲線、LINE/Email 自動催單）——這是「報價師」獨立專案的範圍，這次只定義案神下指令給報價師的交接格式
- 不把案神變成常駐系統：`realtime-need-capture` 只在對談進行的當下運作（人啟動才動），`demo-generation-deploy` 是「產出+部署一次」的動作，不是背景一直跑的排程服務；跟待神儀表板系統唯一相同點是複用它的部署腳本寫法，不是把 Cron 排程也搬過來
- 不把客戶成交後的正式系統開發包進來，那是「蓋神」接手 Spectra 開發的範圍
- 不修改 `commercial-proposal-quotation-specialist`、`engagement-quote` 的報價計算邏輯

## Decisions

### 用獨立的新 skill 隔開部署，不動 case-page

新增 `demo-generation-deploy` skill 專門處理「生程式碼 + 部署 + 串 D1」，`case-page` 完全不改。理由：`case-page` 服務兩種對象——客戶想先看網頁草稿、或小白把案神丟給自己的 AI 跑——這兩種對象都不需要真的上網，`case-page` 現有「開瀏覽器就能看，關網路也正常」的自包含特性是刻意設計，不該為了新需求犧牲掉。把「要部署」跟「不部署」拆成兩個不同的 skill，各自單一職責。

備選方案（否決）：直接修改 `case-page` 加一個「要不要部署」的開關。否決理由：`case-page` 的驗收標準本來就包含「關閉網路連線也要完整正常顯示」，混入部署邏輯會讓這條驗收條件變得含糊，且違反案神既有規則文件明文寫下的原則。

### 即時語音轉文字：Cloudflare Workers AI Whisper 起手，缺口才補 ElevenLabs Scribe v2 Realtime

錄音轉文字的基礎需求用 Cloudflare Workers AI 內建的 Whisper（已有現成帳號可用，近乎免費）；如果驗證後發現延遲不夠即時（客戶已研究過的資料顯示現有工具都是「錄完再轉」，不是「邊講邊轉」），才升級接 ElevenLabs Scribe v2 Realtime（帳號已存在於 `bni`／`摩托斯MOLTOS` 專案）。先用便宜的驗證可行性，不夠再換，不預先假設一定要上串流方案。

### Demo 部署複用待神已驗證過的部署腳本寫法，內容邏輯完全獨立

`demo-generation-deploy` 部署到 Cloudflare Pages 這一步，參考待神（Awesome-Dyson）`scripts/dashboard-deploy.sh` 已經驗證過的做法：單一 writer lock 避免同時部署衝突、用 `--branch=main` 明確指定走 Production 而非 Preview、部署後用穩定的 DOM 標記（不是會變動的 title 文字）驗證是否成功。只借部署機制的寫法，`demo-generation-deploy` 產出的內容（客製接案 Demo）跟待神儀表板的內容（專案進度）完全獨立，不共用同一個 state.json/entries 結構。

### 第三方服務示意與媒體自動補位，都收在 demo-generation-deploy 底下

不額外拆出 `third-party-demo-embed`、`media-autofill` 這兩個獨立 capability。理由：兩者都是「demo-generation-deploy 生成 Demo 內容時的其中一步」，不是獨立可以單獨被呼叫的能力，拆成獨立 capability 只會增加維護面沒有實際好處。

### 案神到報價師的交接只定義指令格式，不做報價師實作

新增 `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md`，定義「案神確認報價後」要傳給報價師的資料形狀（客戶識別資訊、確認的價格與條款、案件識別碼），格式上參照案神既有 `contracts/PM-TO-QUOTE-DATA-PACK.md` 的寫法（同一份 repo 已有的慣例，不重新發明格式風格）。報價師收到這份指令後要做什麼，完全是報價師那個獨立專案的事，這份文件只定義案神「送出什麼」，不定義報價師「怎麼處理」。

## Implementation Contract

**行為（人看到的結果）：**
- 業務員在跟客戶對談時觸發 `realtime-need-capture`，對談過程中即時看到語音轉文字結果與拆解出的需求分類（人群/場景/痛點/需求/解決方案，或 12 格拆解表格），每拆出一項標「已確認/待確認/我猜的」（沿用案神既有 project-manager 的標記慣例）
- 需求確認後，業務員呼叫 `demo-generation-deploy`，幾分鐘內拿到一個真實網址（`https://<案件代號>-demo.pages.dev`），客戶當場能點擊操作，網站有 D1 支援的簡易登入後台
- 若客戶需求含第三方服務串接，Demo 首頁或對應分頁會嵌入該服務的即時示意畫面（例如 LINE OA 對話框模擬）
- 若 Demo 素材缺圖/缺影片，該區塊會顯示自動生成的示意內容，且明顯標示「示意用，非最終素材」

**介面／資料形狀：**
- `realtime-need-capture` 產出一份「即時需求拆解資料包」，欄位比照案神既有 `PM-to-Quote Data Pack` 擴充：新增 `capture_mode`（`realtime` / `post-hoc`）、`decomposition`（人群/場景/痛點/需求/解決方案 或 12 格陣列）
- `demo-generation-deploy` 的輸入是「已確認需求資料包」，輸出是：部署網址（string）、部署狀態（`success` / `failed`，失敗要附原因文字）、Demo 內含分頁清單（array）
- `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 定義的資料形狀：`client_id`、`confirmed_price`、`terms`、`case_ref`（呼應報價師那邊要用這個 case_ref 去對應同一個客戶）

**失敗模式：**
- 語音轉文字失敗或信心度過低 → 明確標「聽不清楚，需要人工補」，不能靜默用猜測結果填進拆解資料
- Cloudflare Pages 部署失敗 → 不能假裝成功，要回報實際錯誤原因（額度、專案名稱衝突等），並保留上一個成功版本網址繼續可用
- 第三方服務示意或素材生成 API 失敗 → 該區塊顯示明確的「此區塊生成失敗」提示，不能留白讓客戶以為是設計上的空白

**驗收標準：**
- 一次完整流程（模擬對談輸入 → 拆解出資料包 → 部署出網址）跑得通，`curl` 該網址回 200
- `case-page` 的既有測試/驗收條件（開瀏覽器離線也正常顯示）不受影響，跑一次原有驗收確認沒有回歸
- `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md` 產出的範例資料，欄位跟這份文件定義的形狀一致

**範圍邊界：**
- 範圍內：即時拆解、Demo 生成與部署、第三方示意嵌入、素材自動補位、案神到報價師的指令格式定義
- 範圍外：報價師的任何實作、蓋神接手後的正式開發、`case-page`/`engagement-quote` 既有邏輯的任何修改

## Risks / Trade-offs

- [即時語音轉文字延遲太高，對談中來不及即時拆解] → 先用 Workers AI Whisper 驗證可接受度，不夠快才升級 ElevenLabs Realtime，不預先過度投資
- [Cloudflare Pages 專案數量隨接案量增加，可能撞到帳號額度或命名衝突] → 部署前檢查專案名稱是否已存在，衝突時退回報錯而非覆蓋既有客戶的 Demo
- [自動生成的示意圖片/影片品質不穩定，客戶誤以為是最終交付物] → 所有自動生成素材都要有明顯的「示意用」標記，不能跟正式素材混淆
- [新 skill 跟 case-page 職責邊界模糊，未來被誤用] → design 已明確切開兩者職責，並在兩份 SKILL.md 裡互相註明「這個不做部署，另一個才做部署／這個不做內容判斷，另一個才判斷」

## Open Questions

- ElevenLabs Scribe v2 Realtime 帳號雖然在 `bni`/`摩托斯MOLTOS` 專案已存在，但沒有實際打過即時串流的量測數據，需要先跑一次真實延遲測試才能決定要不要升級
- OpenAI Image API／Nano Banana／可靈／SeaDance／fal.ai／Kie.ai 這幾個素材生成服務，目前只有部分帳號存在（前期研究已確認），實際要選哪一組進 tasks 階段實作前需要 Fish 拍板預算量級
