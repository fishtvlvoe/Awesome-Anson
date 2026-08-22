## 1. Skill 骨架與職責邊界

- [x] 1.1 建立 `.claude/skills/demo-generation-deploy/SKILL.md` 骨架，內容明確宣告「用獨立的新 skill 隔開部署，不動 case-page」這條設計決策，並列出本 skill 專責的部署行為。驗證：`git diff` 顯示 `case-page/SKILL.md` 完全無變更
- [x] 1.2 建立 `.claude/skills/realtime-need-capture/SKILL.md` 骨架，列出即時語音轉文字與即時拆解的觸發時機與輸出格式。驗證：SKILL.md 的 frontmatter 通過既有 skill schema 檢查（跟其他 skill 一樣有 name/description）

## 2. 即時需求拆解（Requirement: Real-time speech-to-text during client conversation / Real-time need decomposition）

- [x] 2.1 實作 Real-time speech-to-text during client conversation：對談時把語音串流送進 Cloudflare Workers AI Whisper，即時回傳文字片段。驗證：餵一段錄音樣本，輸出文字跟人工聽打結果做比對，記錄正確率
- [x] 2.2 實作低信心片段標記（Scenario: Low-confidence transcription is flagged, not guessed）：信心度低於門檻的片段標「聽不清楚，需要人工補」，不能靜默填入猜測文字。驗證：餵一段雜訊音檔，輸出必須出現該標記字串，且不含任何猜測填入的文字
- [x] 2.3 實作 Real-time need decomposition：把轉出的文字即時拆成人群/場景/痛點/需求/解決方案五類。驗證：跑一段模擬逐字稿，輸出五個分類欄位都非空或明確標「待確認」
- [x] 2.4 實作服務型任務的 4x4 拆解（Scenario: Service-type engagement uses the 4x4 breakdown instead）：偵測到服務型任務時改用 12 格拆解，取代五分類。驗證：輸入一筆標記為服務型的案例，輸出格式為 12 格陣列
- [x] 2.5 實作三態標記（Requirement: Every decomposed item carries a confirmation status）：每個拆解項目標「已確認/待確認/我猜的」。驗證：檢查輸出 JSON 每個 item 都帶三態其中一個標籤，且「我猜的」項目從不被系統自動升級成「已確認」
- [x] 2.6 擴充 PM-to-Quote Data Pack 格式（Requirement: Output feeds the existing PM-to-Quote Data Pack format），新增 `capture_mode` 與 `decomposition` 欄位。驗證：`commercial-proposal-quotation-specialist` 讀取一份帶新欄位的資料包，既有報價邏輯照常跑完不出錯
- [x] 2.7（cross-impact ⚠️）修改 `.claude/agents/project-manager.md` 後重跑 `scripts/validate-agent-system.sh`，確認該腳本硬性依賴的 `grill-with-docs` 字串沒有被誤刪。驗證：`scripts/validate-agent-system.sh` 執行結果全綠

## 3. 即時語音方案驗證（即時語音轉文字：Cloudflare Workers AI Whisper 起手，缺口才補 ElevenLabs Scribe v2 Realtime）

- [x] 3.1 跑一次 Cloudflare Workers AI Whisper 的真實延遲測試，記錄從說話結束到文字出現的秒數。驗證：產出一份含至少 5 次測試樣本秒數的紀錄檔
- [x] 3.2 若 3.1 測出的延遲不符即時拆解需求，接 ElevenLabs Scribe v2 Realtime 作為升級路徑（沿用「即時語音轉文字：Cloudflare Workers AI Whisper 起手，缺口才補 ElevenLabs Scribe v2 Realtime」這條決策）。驗證：同一段錄音樣本改用 ElevenLabs 跑過，延遲秒數記錄下來跟 3.1 比較

## 4. Demo 生成與部署（Requirement: Generate a live demo site from confirmed requirements）

- [x] 4.1 實作 Generate a live demo site from confirmed requirements：把已確認資料包轉成 Demo 程式碼，套用「Demo 部署複用待神已驗證過的部署腳本寫法，內容邏輯完全獨立」的做法（單一 writer lock、`--branch=main`、穩定 DOM 標記驗證），部署到 Cloudflare Pages。驗證：`curl` 部署後的網址回應 200
- [x] 4.2 實作部署失敗明確回報（Scenario: Deployment failure is surfaced, not hidden）：故意用一個已存在的專案名稱觸發命名衝突，確認錯誤訊息包含實際失敗原因，且該客戶舊版網址仍可正常開啟。驗證：手動觸發一次衝突情境，檢查錯誤訊息與舊網址存活狀態
- [x] 4.3 實作 Demo includes a D1-backed login backend：資料包標記需要登入時 provision D1 並串最簡登入流程。驗證：對一筆「需要登入」的資料包跑過，產出網站含登入頁；對一筆「不需要登入」的資料包跑過，確認沒有多餘 D1 資源被建立
- [x] 4.4 實作 Third-party service embed inside the demo：需求提到第三方服務時嵌入對應即時示意畫面，套用「第三方服務示意與媒體自動補位，都收在 demo-generation-deploy 底下」的收斂原則。驗證：輸入含「LINE OA」的資料包，產出頁面含對應示意區塊；輸入含未支援服務的資料包，產出頁面顯示（Scenario: Unsupported third-party service falls back explicitly）定義的明確提示文字
- [x] 4.5 實作 Automatic placeholder media generation：缺圖缺影片時自動生成示意素材並標「示意用」。驗證：故意不提供素材跑一次，產出頁面該區塊出現示意素材與標籤；故意讓生成 API 回錯誤，確認顯示（Scenario: Media generation API failure is shown, not left blank）定義的失敗提示而非空白

## 5. 邊界回歸與報價師交接

- [x] 5.1 回歸驗證 This capability does not deploy through case-page（Scenario: case-page's offline guarantee still holds after this change ships）：重跑 case-page 既有驗收流程，確認離線 `file://` 開啟仍正常顯示。驗證：既有 case-page 驗收流程全綠
- [x] 5.2 建立 `contracts/ANSON-TO-QUOTEMASTER-COMMAND.md`，定義 `client_id`／`confirmed_price`／`terms`／`case_ref` 欄位，落實 Command handoff to the quote-master project 與「案神到報價師的交接只定義指令格式，不做報價師實作」這條邊界。驗證：文件內每個欄位都有型別與範例值，且文件內容不包含任何定價/倒數/催單邏輯的實作細節
- [x] 5.3 產出一份範例指令 JSON（Scenario: Command document is emitted, not the pricing logic itself），驗證格式符合 5.2 定義的形狀。驗證：逐欄核對範例 JSON 是否符合定義，且產生這份文件的過程沒有觸發任何價格運算
- [x] 5.4（cross-impact ⚠️）同步更新 `openspec/config.yaml` 的 `context:` 段落，補上 `realtime-need-capture`、`demo-generation-deploy` 兩個新能力的描述（目前只列舊三個 Agent 接力鏈）。驗證：`config.yaml` diff 顯示新增這兩個能力的說明文字
